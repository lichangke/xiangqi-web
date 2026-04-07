import type { FastifyInstance } from 'fastify';
import { z } from 'zod';
import type { ResolveNarrativeRequest } from '@xiangqi-web/shared';
import { config } from '../config.js';

const resolveNarrativeSchema = z.object({
  theme: z.enum(['classic', 'ink', 'midnight']),
  envelope: z.object({
    schemaVersion: z.literal('v1'),
    requestId: z.string().min(1),
    gameContext: z.object({
      gameId: z.string().min(1),
      turnNumber: z.number().int().min(1),
      userSide: z.enum(['red', 'black']),
      aiSide: z.enum(['red', 'black']),
      difficulty: z.enum(['BEGINNER', 'NORMAL', 'HARD', 'MASTER']),
      gameStatus: z.enum(['ONGOING', 'CHECKMATED', 'STALEMATE', 'RESIGNED', 'DRAW']),
      isCheck: z.boolean(),
      isGameEnding: z.boolean(),
      storyThreadSummary: z.object({
        currentPhase: z.enum(['试探期', '抢势期', '对压期', '解围期', '收束期']),
        mainConflict: z.string(),
        pressureSide: z.enum(['RED', 'BLACK', 'BALANCED']),
        recentFocus: z.string(),
        carryForward: z.string(),
      }),
    }),
    themeContext: z.object({
      storyThemeId: z.string(),
      storyThemeName: z.string(),
      themeTone: z.string(),
      doNotUseStyles: z.array(z.string()),
    }),
    roleContext: z.object({
      activeRoles: z.array(z.string()),
      roleCardsVersion: z.literal('v1'),
      roleHints: z.array(z.string()),
    }),
    itemType: z.enum(['turn', 'event']),
    itemPayload: z.any(),
    constraints: z.object({
      maxChars: z.number().int().positive(),
      segmentCount: z.number().int().positive(),
      language: z.literal('zh-CN'),
      mustStayGroundedInFacts: z.literal(true),
      allowWorldExpansion: z.literal(false),
      mustReturnJson: z.literal(true),
    }),
    fallbackPolicy: z.object({
      fallbackMode: z.literal('template-minimal'),
      timeoutMs: z.number().int().positive(),
      onSchemaInvalid: z.literal('fallback'),
      onEmptyResponse: z.literal('fallback'),
    }),
  }),
});

export async function narrativeRoutes(app: FastifyInstance) {
  app.post('/api/narrative/resolve', async (request, reply) => {
    const parsed = resolveNarrativeSchema.safeParse(request.body);
    if (!parsed.success) {
      return reply.status(400).send({
        error: {
          code: 'NARRATIVE_BAD_REQUEST',
          message: 'narrative 请求参数不合法',
        },
      });
    }

    console.warn('[bundle-d23-narrative-route-debug]', {
      requestId: parsed.data.envelope.requestId,
      theme: parsed.data.theme,
      itemType: parsed.data.envelope.itemType,
      timeoutMs: parsed.data.envelope.fallbackPolicy.timeoutMs,
      hasNarrativeKey: Boolean(config.narrativeApiKey),
    });

    const result = await app.narrativeService.resolveNarrative(parsed.data.envelope, parsed.data.theme);
    return reply.send(result);
  });
}
