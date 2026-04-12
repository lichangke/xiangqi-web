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

const MAX_PROVIDER_REASON_LENGTH = 48;

type ProviderWireApi = 'chat_completions' | 'responses';

type ChatCompletionJsonPayload = {
  choices?: Array<{ message?: { content?: string | Array<{ type?: string; text?: string }> } }>;
};

type ResponseApiPayload = {
  id?: string;
  status?: string | null;
  output_text?: string | null;
  output?: Array<{
    type?: string;
    content?: Array<{
      type?: string;
      text?: string;
    }>;
  }>;
};

type ResponseApiStreamEvent = {
  type?: string;
  delta?: string;
  response?: ResponseApiPayload;
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

function detectProviderWireApi(apiBase: string): ProviderWireApi {
  try {
    const hostname = new URL(normalizeApiBase(apiBase)).hostname.toLowerCase();
    if (hostname === 'codex.hiyo.top') {
      return 'responses';
    }
  } catch {
    if (apiBase.includes('codex.hiyo.top')) {
      return 'responses';
    }
  }

  return 'chat_completions';
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

function normalizeResponsesOutput(payload: ResponseApiPayload) {
  if (typeof payload.output_text === 'string' && payload.output_text.trim()) {
    return payload.output_text;
  }

  const parts = payload.output?.flatMap((item) => item.content ?? []) ?? [];
  const text = parts
    .filter((item) => item.type === 'output_text' || item.type === 'text' || typeof item.text === 'string')
    .map((item) => item.text ?? '')
    .join('');

  return text;
}

async function readChatCompletionsText(response: Response) {
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

  const payload = await response.json() as ChatCompletionJsonPayload;
  return normalizeProviderContent(payload.choices?.[0]?.message?.content);
}

function summarizeResponsesPayload(payload: ResponseApiPayload) {
  const output = Array.isArray(payload.output) ? payload.output : [];
  const contentItems = output.flatMap((item) => Array.isArray(item.content) ? item.content : []);

  return {
    responseId: payload.id ?? null,
    responseStatus: payload.status ?? null,
    hasOutputText: typeof payload.output_text === 'string' && payload.output_text.length > 0,
    outputTextLength: typeof payload.output_text === 'string' ? payload.output_text.length : 0,
    outputLength: output.length,
    outputTypes: output.slice(0, 5).map((item) => item.type ?? 'unknown'),
    contentItemCount: contentItems.length,
    contentTypes: contentItems.slice(0, 8).map((item) => item.type ?? 'unknown'),
    hasAnyTextField: contentItems.some((item) => typeof item.text === 'string' && item.text.length > 0),
    firstTextLength: (() => {
      const first = contentItems.find((item) => typeof item.text === 'string' && item.text.length > 0);
      return typeof first?.text === 'string' ? first.text.length : 0;
    })(),
  };
}

async function readResponsesApiText(response: Response) {
  const contentType = response.headers.get('content-type')?.toLowerCase() ?? '';

  if (contentType.includes('text/event-stream')) {
    const raw = await response.text();
    const lines = raw.split(/\r?\n/);
    let text = '';
    let completedPayload: ResponseApiPayload | undefined;

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
        const event = JSON.parse(data) as ResponseApiStreamEvent;
        if (event.type === 'response.output_text.delta' && typeof event.delta === 'string') {
          text += event.delta;
        }
        if (event.type === 'response.completed' && event.response && typeof event.response === 'object') {
          completedPayload = event.response;
        }
      } catch {
        // ignore malformed chunks and let fallback handle empty result
      }
    }

    return {
      text,
      summary: summarizeResponsesPayload(completedPayload ?? {}),
    };
  }

  const payload = await response.json() as ResponseApiPayload;
  const text = normalizeResponsesOutput(payload);

  return {
    text,
    summary: summarizeResponsesPayload(payload),
  };
}

function buildDecisionSystemPrompt() {
  return [
    '你是象棋对局 decision 选择器。',
    '先按 inputContract.requiredReadOrder 阅读输入。',
    '优先参考 legalMoveDigest 与 priorityCandidates，把 legalMoves 视为最终合法性校验清单。',
    '必须严格从给定 legalMoves 中挑选一手，返回 JSON 对象，不得输出 markdown、解释或前后缀。',
    '顶层字段必须是 move 和可选的 reason。',
    'move 只能包含 from 和 to。',
    '不得返回任何不在 legalMoves 中的走法。',
    'reason 若提供，必须是 1 句简短中文，不超过 24 个字，聚焦当前这手的局面意图，优先落在压迫、解围、抢位、换子、收束、稳阵、试探之一，不要复述输入字段，不要写空话。',
  ].join(' ');
}

function buildDecisionReasonConstraints() {
  return {
    language: 'zh-CN',
    maxLength: 24,
    style: 'single_sentence_brief',
    focusTags: ['压迫', '解围', '抢位', '换子', '收束', '稳阵', '试探'],
    forbid: ['markdown', 'bullet_list', 'prefix_suffix', 'repeat_input', 'generic_empty_phrases'],
  };
}

function sanitizeProviderReason(reason: string | undefined) {
  if (!reason) {
    return undefined;
  }

  const normalized = reason
    .replace(/```[\s\S]*?```/g, ' ')
    .replace(/[\r\n\t]+/g, ' ')
    .replace(/[*#>`\-]+/g, ' ')
    .replace(/\s+/g, ' ')
    .trim();

  if (!normalized) {
    return undefined;
  }

  const genericPhrases = [
    '综合来看',
    '总体来看',
    '从当前局面来看',
    '根据当前局面',
    '这是一个不错的选择',
    '这是较好的选择',
    '这样可以更好地',
    '有助于后续推进',
    '局面会更加有利',
  ];

  if (genericPhrases.some((phrase) => normalized === phrase || normalized.startsWith(`${phrase}，`) || normalized.startsWith(`${phrase},`))) {
    return undefined;
  }

  const clipped = normalized.length > MAX_PROVIDER_REASON_LENGTH
    ? `${normalized.slice(0, MAX_PROVIDER_REASON_LENGTH - 1)}…`
    : normalized;

  return clipped;
}
function buildDifficultyGuide(difficulty: Difficulty) {
  switch (difficulty) {
    case 'BEGINNER':
      return '优先简单、稳妥、易解释的合法应手，不强求最优。';
    case 'NORMAL':
      return '优先稳健，其次兼顾主动权与局面压力。';
    case 'HARD':
      return '优先更强的先手、压迫与结构收益，但仍必须可解释。';
    case 'MASTER':
    default:
      return '优先当前最强的合法应手，不为表面平稳牺牲实质收益。';
  }
}

function summarizeLegalMoves(fen: string, legalMoves: RuleMove[], rules: RuleAdapter) {
  const byPiece: Record<string, number> = {};
  const captureMoveSamples: string[] = [];
  const checkMoveSamples: string[] = [];
  const centralControlSamples: string[] = [];

  for (const move of legalMoves) {
    const piece = move.piece?.toUpperCase() ?? 'UNKNOWN';
    byPiece[piece] = (byPiece[piece] ?? 0) + 1;

    const moveCode = `${move.from}${move.to}`;
    if (move.captured && captureMoveSamples.length < 6) {
      captureMoveSamples.push(moveCode);
    }

    if (['d', 'e', 'f'].includes(move.to[0] ?? '') && centralControlSamples.length < 6) {
      centralControlSamples.push(moveCode);
    }

    const applied = rules.applyMove(fen, move);
    if (applied.ok && applied.summary.isCheck && checkMoveSamples.length < 6) {
      checkMoveSamples.push(moveCode);
    }
  }

  return {
    total: legalMoves.length,
    byPiece,
    captureMoveCount: legalMoves.filter((move) => Boolean(move.captured)).length,
    checkMoveCount: checkMoveSamples.length,
    centralControlMoveCount: legalMoves.filter((move) => ['d', 'e', 'f'].includes(move.to[0] ?? '')).length,
    captureMoveSamples,
    checkMoveSamples,
    centralControlSamples,
  };
}

function buildPriorityCandidates(fen: string, legalMoves: RuleMove[], rules: RuleAdapter) {
  const currentState = rules.getGameState(fen);

  const prioritized = legalMoves
    .map((move) => {
      const applied = rules.applyMove(fen, move);
      const moveCode = `${move.from}${move.to}`;
      const isCenterMove = ['d', 'e', 'f'].includes(move.to[0] ?? '');
      const pieceCode = move.piece?.toUpperCase() ?? 'UNKNOWN';

      let priorityScore = 0;
      let tacticalTag = '试探';
      let why = '这手更像稳妥试探，适合作为低风险续手。';

      if (applied.ok && applied.summary.isGameOver) {
        priorityScore += 100;
        tacticalTag = '收束';
        why = '这手之后局面直接进入收束，不再只是铺陈。';
      } else if (currentState.isCheck) {
        priorityScore += 85;
        tacticalTag = '解围';
        why = '当前先手带有将军压力，优先考虑先把局面解开。';
      } else if (applied.ok && applied.summary.isCheck) {
        priorityScore += 80;
        tacticalTag = '压迫';
        why = '这手能直接形成将军压力，属于高优先的主动手。';
      } else if (move.captured) {
        priorityScore += 60;
        tacticalTag = '换子';
        why = '这手会直接形成吃子或换子，能立刻改变子力关系。';
      } else if (isCenterMove) {
        priorityScore += 35;
        tacticalTag = '抢位';
        why = '这手会把落点压向中路或要道，适合作为节拍争夺手。';
      } else if (pieceCode === 'R' || pieceCode === 'C' || pieceCode === 'N') {
        priorityScore += 20;
        tacticalTag = '稳阵';
        why = '这手偏向重子展开或稳阵整理，适合作为结构性应手。';
      }

      if (move.captured) {
        priorityScore += 10;
      }

      if (isCenterMove) {
        priorityScore += 6;
      }

      return {
        from: move.from,
        to: move.to,
        piece: move.piece,
        captured: move.captured,
        moveCode,
        tacticalTag,
        why,
        priorityScore,
      };
    })
    .sort((left, right) => {
      if (right.priorityScore !== left.priorityScore) {
        return right.priorityScore - left.priorityScore;
      }

      return left.moveCode.localeCompare(right.moveCode);
    })
    .slice(0, 8)
    .map(({ moveCode, priorityScore, ...item }) => item);

  return prioritized;
}

function buildDecisionUserPayload(input: ResolveDecisionInput, rules: RuleAdapter) {
  const positionState = rules.getGameState(input.fenAfterUserMove);
  const legalMoveDigest = summarizeLegalMoves(input.fenAfterUserMove, input.legalMoves, rules);
  const priorityCandidates = buildPriorityCandidates(input.fenAfterUserMove, input.legalMoves, rules);

  return {
    inputContract: {
      version: 'd2.6',
      objective: 'choose_one_legal_ai_move',
      requiredReadOrder: ['positionState', 'userMove', 'legalMoveDigest', 'priorityCandidates', 'legalMoves', 'recentHistory'],
      outputJsonShape: {
        move: { from: 'string', to: 'string' },
        reason: 'optional short zh-CN sentence',
      },
      hardRules: [
        'move must be selected from legalMoves only',
        'top-level fields must stay inside move + optional reason',
        'do not output markdown or any wrapper text',
      ],
      reasonConstraints: buildDecisionReasonConstraints(),
      noiseControl: {
        legalMovesFields: ['from', 'to'],
        priorityCandidatesMaxCount: 8,
        detailedReasoningHintsField: 'priorityCandidates',
      },
    },
    positionState: {
      nextTurn: positionState.nextTurn,
      isCheck: positionState.isCheck,
      isGameOver: positionState.isGameOver,
      legalMoveCount: input.legalMoves.length,
    },
    difficulty: input.difficulty,
    difficultyGuide: buildDifficultyGuide(input.difficulty),
    fenAfterUserMove: input.fenAfterUserMove,
    legalMoveCount: input.legalMoves.length,
    userMove: {
      from: input.userMove.from,
      to: input.userMove.to,
      piece: input.userMove.piece,
      captured: input.userMove.captured,
    },
    legalMoveDigest,
    priorityCandidates,
    legalMoves: input.legalMoves.map((move) => ({
      from: move.from,
      to: move.to,
    })),
    recentHistory: input.history.slice(-6).map((item) => ({
      actor: item.actor,
      from: item.from,
      to: item.to,
      piece: item.piece,
      captured: item.captured,
    })),
  };
}

function buildChatCompletionsBody(modelName: string, payload: ReturnType<typeof buildDecisionUserPayload>) {
  return {
    model: modelName,
    temperature: 0.2,
    stream: true,
    response_format: { type: 'json_object' },
    messages: [
      {
        role: 'system',
        content: buildDecisionSystemPrompt(),
      },
      {
        role: 'user',
        content: JSON.stringify(payload),
      },
    ],
  };
}

function buildResponsesApiBody(modelName: string, payload: ReturnType<typeof buildDecisionUserPayload>) {
  return {
    model: modelName,
    store: false,
    max_output_tokens: 256,
    instructions: buildDecisionSystemPrompt(),
    input: [
      {
        role: 'user',
        content: JSON.stringify(payload),
      },
    ],
    stream: true,
  };
}

function summarizeDecisionPayload(payload: ReturnType<typeof buildDecisionUserPayload>) {
  return {
    contractVersion: payload.inputContract.version,
    requiredReadOrder: payload.inputContract.requiredReadOrder,
    nextTurn: payload.positionState.nextTurn,
    isCheck: payload.positionState.isCheck,
    legalMoveCount: payload.legalMoveCount,
    priorityCandidateCount: payload.priorityCandidates.length,
    priorityCandidateTags: payload.priorityCandidates.slice(0, 5).map((item) => item.tacticalTag),
    noiseControl: payload.inputContract.noiseControl,
    difficulty: payload.difficulty,
  };
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
    reason: sanitizeProviderReason(typeof candidate.reason === 'string' ? candidate.reason.trim() : undefined),
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
    let responsesSummary: Record<string, unknown> | undefined;
    let payloadSummary: Record<string, unknown> | undefined;
    const wireApi = detectProviderWireApi(modelConfig.baseUrl);

    try {
      const endpoint = wireApi === 'responses' ? 'responses' : 'chat/completions';
      const decisionPayload = buildDecisionUserPayload(input, this.rules);
      payloadSummary = summarizeDecisionPayload(decisionPayload);
      const body = wireApi === 'responses'
        ? buildResponsesApiBody(modelConfig.modelName, decisionPayload)
        : buildChatCompletionsBody(modelConfig.modelName, decisionPayload);

      const response = await fetch(buildProviderUrl(modelConfig.baseUrl, endpoint), {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${apiKey}`,
        },
        body: JSON.stringify(body),
        signal: AbortSignal.timeout(providerTimeoutMs),
      });

      providerStatus = response.status;
      if (!response.ok) {
        throw new Error(`provider_http_${response.status}`);
      }

      const text = wireApi === 'responses'
        ? (() => {
          const responsesResultPromise = readResponsesApiText(response);
          return responsesResultPromise;
        })()
        : readChatCompletionsText(response);

      const resolvedText = wireApi === 'responses'
        ? await (text as Promise<{ text: string; summary: Record<string, unknown> }>).then((result) => {
          responsesSummary = result.summary;
          return result.text;
        })
        : await (text as Promise<string>);
      if (!resolvedText.trim()) {
        throw new Error(wireApi === 'responses' ? 'provider_empty_response:responses' : 'provider_empty_response');
      }

      let parsedJson: unknown;
      try {
        parsedJson = JSON.parse(resolvedText);
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
        wireApi,
        payloadSummary,
        responsesSummary,
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
        wireApi,
        payloadSummary,
        ...(error instanceof Error && error.message === 'provider_empty_response:responses' ? { responsesSummary } : {}),
      });
      return null;
    }
  }
}
