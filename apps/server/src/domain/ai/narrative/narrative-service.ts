import type { PrismaClient } from '@prisma/client';
import type {
  NarrativeRequestEnvelope,
  ResolveNarrativeResponse,
  ThemeKey,
} from '@xiangqi-web/shared';
import { config } from '../../../config.js';
import { buildServerFallbackNarrative, parseNarrativeResponse } from './narrative-fallback.js';

type NarrativeFailurePayload = {
  failureReason: string;
  turnType: 'turn' | 'event';
  eventType: string;
  providerStatus?: number;
  hasChoices?: boolean;
  rawContentType?: string;
  contentLength?: number;
  providerTimeoutMs?: number;
};

type ChatCompletionJsonPayload = {
  choices?: Array<{ message?: { content?: string | Array<{ type?: string; text?: string }> } }>;
};

function logNarrativeFailure(payload: NarrativeFailurePayload) {
  console.warn('[bundle-d23-narrative-server-fallback]', payload);
}

function getEnvBackedApiKey() {
  return config.narrativeApiKey;
}

function normalizeApiBase(apiBase: string) {
  return apiBase.endsWith('/') ? apiBase : `${apiBase}/`;
}

function buildProviderUrl(apiBase: string, endpoint: string) {
  return new URL(endpoint.replace(/^\/+/, ''), normalizeApiBase(apiBase)).toString();
}

function getRawContentType(rawContent: unknown) {
  if (typeof rawContent === 'string') {
    return 'string';
  }

  if (Array.isArray(rawContent)) {
    return 'array';
  }

  if (rawContent === null) {
    return 'null';
  }

  return typeof rawContent;
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
    let hasChoices = false;

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

        if (Array.isArray(chunk.choices) && chunk.choices.length > 0) {
          hasChoices = true;
        }

        const deltaContent = chunk.choices?.[0]?.delta?.content;
        const messageContent = chunk.choices?.[0]?.message?.content;
        const part = normalizeProviderContent(deltaContent ?? messageContent);
        if (part) {
          text += part;
        }
      } catch {
        // ignore malformed chunks; fallback path will handle empty text if nothing useful was parsed
      }
    }

    return {
      text,
      hasChoices,
      rawContentType: 'sse',
    };
  }

  const payload = await response.json() as ChatCompletionJsonPayload;
  const hasChoices = Array.isArray(payload.choices) && payload.choices.length > 0;
  const rawContent = payload.choices?.[0]?.message?.content;

  return {
    text: normalizeProviderContent(rawContent),
    hasChoices,
    rawContentType: getRawContentType(rawContent),
  };
}

export class NarrativeService {
  constructor(private readonly prisma: PrismaClient) {}

  async resolveNarrative(envelope: NarrativeRequestEnvelope, theme: ThemeKey): Promise<ResolveNarrativeResponse> {
    const modelConfig = await this.prisma.modelConfig.findUnique({ where: { configKey: 'narrative' } });
    const apiKey = getEnvBackedApiKey();

    if (!modelConfig?.enabled || !modelConfig.modelName || !modelConfig.baseUrl || !apiKey) {
      logNarrativeFailure({
        failureReason: 'provider_precondition_missing',
        turnType: envelope.itemType,
        eventType: envelope.itemType === 'event' ? (envelope.itemPayload as import('@xiangqi-web/shared').NarrativeEventPayload).eventType : 'none',
      });

      return {
        response: buildServerFallbackNarrative(envelope, theme),
        source: 'server-fallback',
        fallbackUsed: true,
      };
    }

    let providerStatus: number | undefined;
    let hasChoices: boolean | undefined;
    let rawContentType: string | undefined;
    let contentLength: number | undefined;
    const providerTimeoutMs = Math.max(envelope.fallbackPolicy.timeoutMs, 20000);

    try {
      const response = await fetch(buildProviderUrl(modelConfig.baseUrl, 'chat/completions'), {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${apiKey}`,
        },
        body: JSON.stringify({
          model: modelConfig.modelName,
          temperature: 0.4,
          stream: true,
          response_format: { type: 'json_object' },
          messages: [
            {
              role: 'system',
              content: [
                '你是象棋 narrative 生成器。',
                '必须严格基于给定 envelope 输出一个 JSON 对象，不得输出 markdown、解释或前后缀。',
                '顶层字段必须是：schemaVersion, itemType, title, summary, tone, highlightLevel, segments, displayHints。',
                'schemaVersion 必须固定为 "v1"。itemType 必须与传入 envelope.itemType 一致。',
                'segments 必须是数组。若 itemType=turn，则每个 segment 必须使用 kind/label/text，且 kind 只能是 review、voices、consensus、decision。',
                '若 itemType=event，则 kind 只能是 event、impact、closure。',
                '不要输出 type、roleLine、narration 这类自定义结构；只允许输出项目既有 NarrativeResponseEnvelope 结构。',
                '内容必须基于给定棋局事实，不得扩写世界观。',
              ].join(' '),
            },
            {
              role: 'user',
              content: JSON.stringify({ theme, envelope }),
            },
          ],
        }),
        signal: AbortSignal.timeout(providerTimeoutMs),
      });

      providerStatus = response.status;
      if (!response.ok) {
        throw new Error(`provider_http_${response.status}`);
      }

      const providerText = await readProviderText(response);
      hasChoices = providerText.hasChoices;
      rawContentType = providerText.rawContentType;
      const text = providerText.text;
      contentLength = text.length;

      if (!text.trim()) {
        throw new Error('provider_empty_response');
      }

      let parsedJson: unknown;
      try {
        parsedJson = JSON.parse(text);
      } catch (error) {
        throw new Error(`provider_json_invalid:${error instanceof Error ? error.message : 'unknown'}`);
      }

      const parsed = parseNarrativeResponse(parsedJson, envelope.itemType);
      if (!parsed) {
        throw new Error('provider_schema_invalid');
      }

      console.warn('[bundle-d23-narrative-provider-success]', {
        requestId: envelope.requestId,
        turnType: envelope.itemType,
        providerStatus,
        contentLength,
        providerTimeoutMs,
        modelName: modelConfig.modelName,
        baseUrl: modelConfig.baseUrl,
        rawContentType,
      });

      return {
        response: parsed,
        source: 'provider',
        fallbackUsed: false,
      };
    } catch (error) {
      logNarrativeFailure({
        failureReason: error instanceof Error ? error.message : 'provider_failed',
        turnType: envelope.itemType,
        eventType: envelope.itemType === 'event' ? (envelope.itemPayload as import('@xiangqi-web/shared').NarrativeEventPayload).eventType : 'none',
        providerStatus,
        hasChoices,
        rawContentType,
        contentLength,
        providerTimeoutMs,
      });

      return {
        response: buildServerFallbackNarrative(envelope, theme),
        source: 'server-fallback',
        fallbackUsed: true,
      };
    }
  }
}
