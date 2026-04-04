import type { FastifyInstance } from 'fastify';
import { z } from 'zod';
import { getModelRuntimeStatus } from '../domain/auth/auth-service.js';
import { requireUser } from '../domain/auth/require-auth.js';
import { HttpError } from '../utils/http-error.js';

const createGameSchema = z.object({
  difficulty: z.enum(['BEGINNER', 'NORMAL', 'HARD', 'MASTER']),
});

const moveSchema = z.object({
  from: z.string().min(2).max(3),
  to: z.string().min(2).max(3),
});

const gameParamsSchema = z.object({
  gameId: z.string().min(1),
});

export async function gameRoutes(app: FastifyInstance) {
  app.post('/api/games', async (request, reply) => {
    const user = await requireUser(request, app.prisma);
    const parsed = createGameSchema.safeParse(request.body);
    if (!parsed.success) {
      throw new HttpError(400, 'GAME_BAD_REQUEST', '缺少难度参数');
    }

    const modelRuntimeStatus = await getModelRuntimeStatus(app.prisma);
    if (!modelRuntimeStatus.hasAnyEnabledModelConfig) {
      throw new HttpError(
        503,
        'MODEL_NOT_CONFIGURED',
        '当前后台尚未完成可用模型配置，暂时不能新开对局',
        modelRuntimeStatus.message ?? '请管理员先在后台完成模型配置并启用至少一个模型',
      );
    }

    const result = await app.gameService.createGame(user.id, parsed.data.difficulty);
    return reply.code(201).send({ game: result });
  });

  app.get('/api/games/current', async (request, reply) => {
    const user = await requireUser(request, app.prisma);
    const game = await app.gameService.getCurrentGame(user.id);
    return reply.send({ game });
  });

  app.post('/api/games/:gameId/moves', async (request, reply) => {
    const user = await requireUser(request, app.prisma);
    const params = gameParamsSchema.safeParse(request.params);
    const body = moveSchema.safeParse(request.body);

    if (!params.success || !body.success) {
      throw new HttpError(400, 'GAME_BAD_REQUEST', '落子参数不完整');
    }

    const result = await app.gameService.submitMove(user.id, params.data.gameId, body.data);
    return reply.send(result);
  });

  app.post('/api/games/:gameId/undo', async (request, reply) => {
    const user = await requireUser(request, app.prisma);
    const params = gameParamsSchema.safeParse(request.params);
    if (!params.success) {
      throw new HttpError(400, 'GAME_BAD_REQUEST', '缺少对局 ID');
    }

    const result = await app.gameService.undoLastRound(user.id, params.data.gameId);
    return reply.send(result);
  });

  app.post('/api/games/:gameId/resign', async (request, reply) => {
    const user = await requireUser(request, app.prisma);
    const params = gameParamsSchema.safeParse(request.params);
    if (!params.success) {
      throw new HttpError(400, 'GAME_BAD_REQUEST', '缺少对局 ID');
    }

    const result = await app.gameService.resignGame(user.id, params.data.gameId);
    return reply.send({ game: result });
  });
}
