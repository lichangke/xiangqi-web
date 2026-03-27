import type { FastifyInstance } from 'fastify';
import { z } from 'zod';
import { requireUser } from '../domain/auth/require-auth.js';
import { HttpError } from '../utils/http-error.js';

const createGameSchema = z.object({
  difficulty: z.enum(['BEGINNER', 'NORMAL', 'HARD', 'MASTER']),
});

export async function gameRoutes(app: FastifyInstance) {
  app.post('/api/games', async (request, reply) => {
    const user = await requireUser(request, app.prisma);
    const parsed = createGameSchema.safeParse(request.body);
    if (!parsed.success) {
      throw new HttpError(400, 'GAME_BAD_REQUEST', '缺少难度参数');
    }

    const game = await app.gameService.createGame(user.id, parsed.data.difficulty);
    return reply.code(201).send({
      game: {
        id: game.id,
        status: game.status,
        difficulty: game.difficulty,
        currentFen: game.currentFen,
        undoCount: game.undoCount,
        moves: JSON.parse(game.moveHistory),
        startedAt: game.startedAt,
        updatedAt: game.updatedAt,
      },
    });
  });

  app.get('/api/games/current', async (request, reply) => {
    const user = await requireUser(request, app.prisma);
    const game = await app.gameService.getCurrentGame(user.id);

    if (!game) {
      return reply.send({ game: null });
    }

    return reply.send({
      game: {
        id: game.id,
        status: game.status,
        difficulty: game.difficulty,
        currentFen: game.currentFen,
        undoCount: game.undoCount,
        moves: JSON.parse(game.moveHistory),
        startedAt: game.startedAt,
        updatedAt: game.updatedAt,
      },
    });
  });
}
