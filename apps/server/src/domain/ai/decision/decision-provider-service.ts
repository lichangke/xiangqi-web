import type { PrismaClient } from '@prisma/client';
import type { Difficulty, RuleMove } from '@xiangqi-web/shared';
import { config } from '../../../config.js';
import type { PersistedMoveRecord } from '../../game/types.js';
import type { RuleAdapter } from '../../rules/types.js';

type DecisionProviderPayload = {
  move?: {
    from?: string;
    to?: string;
  };
  reason?: string;
};

type ResolveDecisionInput = {
  fenAfterUserMove: string;
  difficulty: Difficulty;
  history: PersistedMoveRecord[];
  userMove: PersistedMoveRecord;
  legalMoves: RuleMove[];
};

type ResolveDecisionResult = {
  move: RuleMove;
  source: 'provider';
  reason?: string;
};

function logDecisionFailure(payload: Record<string, unknown>) {
  console.warn('[bundle-d24-decision-server-fallback]', payload);
}

function logDecisionSuccess(payload: Record<string, unknown>) {
  console.warn('[bundle-d24-decision-provider-success]', payload);
}

function getEnvBackedApiKey() {
  return config.decisionApiKey;
}

function normalizeApiBase(apiBase: string) {
  return apiBase.endsWith('/') ? apiBase : `${apiBase}/`;
}

function buildProviderUrl(apiBase: string, endpoint: string) {
  return new URL(endpoint.replace(/^\/+/, ''), normalizeApiBase(apiBase)).toString();
}

function normalizeProviderContent(rawContent: unknown) {
  if (typeof rawContent === 'string') {
    return rawContent;
  }

  if (Array.isArray(rawContent)) {
    return rawContent.map((item) => item?.text ?? '').join('');
  }

  return '';
}

async function readProviderText(response: Response) {
  const contentType = response.headers.get('content-type')?.toLowerCase() ?? '';

  if (contentType.includes('text/event-stream')) {
    const raw = await response.text();
    const lines = raw.split(/\r?\n/);
    let text = '';

    for (const line of lines) {
      const trimmed = line.trim();
      if (!trimmed.startsWith('data:')) {
        continue;
      }

      const data = trimmed.slice(5).trim();
      if (!data || data === '[DONE]') {
        continue;
      }

      try {
        const chunk = JSON.parse(data) as {
          choices?: Array<{
            delta?: { content?: string | Array<{ type?: string; text?: string }> };
            message?: { content?: string | Array<{ type?: string; text?: string }> };
          }>;
        };

        const deltaContent = chunk.choices?.[0]?.delta?.content;
        const messageContent = chunk.choices?.[0]?.message?.content;
        const part = normalizeProviderContent(deltaContent ?? messageContent);
        if (part) {
          text += part;
        }
      } catch {
        // ignore malformed chunks and let fallback handle empty result
      }
    }

    return text;
  }

  const payload = await response.json() as {
    choices?: Array<{ message?: { content?: string | Array<{ type?: string; text?: string }> } }>;
  };
  return normalizeProviderContent(payload.choices?.[0]?.message?.content);
}

function parseProviderDecision(raw: unknown) {
  if (!raw || typeof raw !== 'object') {
    return null;
  }

  const candidate = raw as DecisionProviderPayload;
  if (!candidate.move || typeof candidate.move !== 'object') {
    return null;
  }

  const from = candidate.move.from?.trim();
  const to = candidate.move.to?.trim();
  if (!from || !to) {
    return null;
  }

  return {
    from,
    to,
    reason: typeof candidate.reason === 'string' ? candidate.reason.trim() : undefined,
  };
}

export class DecisionProviderService {
  constructor(
    private readonly prisma: PrismaClient,
    private readonly rules: RuleAdapter,
  ) {}

  async resolveDecision(input: ResolveDecisionInput): Promise<ResolveDecisionResult | null> {
    const modelConfig = await this.prisma.modelConfig.findUnique({ where: { configKey: 'decision' } });
    const apiKey = getEnvBackedApiKey();

    if (!modelConfig?.enabled || !modelConfig.modelName || !modelConfig.baseUrl || !apiKey) {
      logDecisionFailure({
        failureReason: 'provider_precondition_missing',
        legalMoveCount: input.legalMoves.length,
      });
      return null;
    }

    const providerTimeoutMs = 20000;
    let providerStatus: number | undefined;

    try {
      const response = await fetch(buildProviderUrl(modelConfig.baseUrl, 'chat/completions'), {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${apiKey}`,
        },
        body: JSON.stringify({
          model: modelConfig.modelName,
          temperature: 0.2,
          stream: true,
          response_format: { type: 'json_object' },
          messages: [
            {
              role: 'system',
              content: [
                '你是象棋对局 decision 选择器。',
                '必须严格从给定 legalMoves 中挑选一手，返回 JSON 对象，不得输出 markdown、解释或前后缀。',
                '顶层字段必须是 move 和可选的 reason。',
                'move 只能包含 from 和 to。',
                '不得返回任何不在 legalMoves 中的走法。',
              ].join(' '),
            },
            {
              role: 'user',
              content: JSON.stringify({
                fenAfterUserMove: input.fenAfterUserMove,
                difficulty: input.difficulty,
                userMove: {
                  from: input.userMove.from,
                  to: input.userMove.to,
                  piece: input.userMove.piece,
                  captured: input.userMove.captured,
                },
                legalMoves: input.legalMoves.map((move) => ({
                  from: move.from,
                  to: move.to,
                  piece: move.piece,
                  captured: move.captured,
                  san: move.san,
                })),
                recentHistory: input.history.slice(-6).map((item) => ({
                  actor: item.actor,
                  from: item.from,
                  to: item.to,
                  piece: item.piece,
                  captured: item.captured,
                })),
              }),
            },
          ],
        }),
        signal: AbortSignal.timeout(providerTimeoutMs),
      });

      providerStatus = response.status;
      if (!response.ok) {
        throw new Error(`provider_http_${response.status}`);
      }

      const text = await readProviderText(response);
      if (!text.trim()) {
        throw new Error('provider_empty_response');
      }

      let parsedJson: unknown;
      try {
        parsedJson = JSON.parse(text);
      } catch (error) {
        throw new Error(`provider_json_invalid:${error instanceof Error ? error.message : 'unknown'}`);
      }

      const parsed = parseProviderDecision(parsedJson);
      if (!parsed) {
        throw new Error('provider_schema_invalid');
      }

      const validated = this.rules.validateMove(input.fenAfterUserMove, { from: parsed.from, to: parsed.to });
      if (!validated.ok) {
        throw new Error(`provider_illegal_move:${validated.reason}`);
      }

      const inLegalMoves = input.legalMoves.find((move) => move.from === parsed.from && move.to === parsed.to);
      if (!inLegalMoves) {
        throw new Error('provider_move_not_in_legal_set');
      }

      logDecisionSuccess({
        providerStatus,
        providerTimeoutMs,
        modelName: modelConfig.modelName,
        baseUrl: modelConfig.baseUrl,
        move: `${parsed.from}${parsed.to}`,
      });

      return {
        move: inLegalMoves,
        source: 'provider',
        reason: parsed.reason,
      };
    } catch (error) {
      logDecisionFailure({
        failureReason: error instanceof Error ? error.message : 'provider_failed',
        providerStatus,
        providerTimeoutMs,
        legalMoveCount: input.legalMoves.length,
      });
      return null;
    }
  }
}
