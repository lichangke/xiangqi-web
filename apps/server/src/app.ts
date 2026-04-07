import Fastify from 'fastify';
import cors from '@fastify/cors';
import type { PrismaClient } from '@prisma/client';
import { createPrismaClient } from './plugins/prisma.js';
import { XiangqiRuleAdapter } from './domain/rules/xiangqi-rule-adapter.js';
import { GameService } from './domain/game/game-service.js';
import { NarrativeService } from './domain/ai/narrative/narrative-service.js';
import { authRoutes } from './routes/auth.js';
import { gameRoutes } from './routes/games.js';
import { adminRoutes } from './routes/admin.js';
import { narrativeRoutes } from './routes/narrative.js';
import { HttpError } from './utils/http-error.js';

declare module 'fastify' {
  interface FastifyInstance {
    prisma: PrismaClient;
    gameService: GameService;
    narrativeService: NarrativeService;
  }
}

export function buildApp(options?: { prisma?: PrismaClient }) {
  const app = Fastify({ logger: false });
  const prisma = options?.prisma ?? createPrismaClient();
  const rules = new XiangqiRuleAdapter();

  app.decorate('prisma', prisma);
  app.decorate('gameService', new GameService(prisma, rules));
  app.decorate('narrativeService', new NarrativeService(prisma));

  app.register(cors, {
    origin: [/localhost:5173$/, /localhost:5174$/],
    credentials: true,
  });

  app.get('/api/health', async () => ({
    ok: true,
    service: 'xiangqi-web-server',
  }));

  app.register(authRoutes);
  app.register(gameRoutes);
  app.register(adminRoutes);
  app.register(narrativeRoutes);

  app.setErrorHandler((error, _request, reply) => {
    if (error instanceof HttpError) {
      return reply.status(error.statusCode).send({
        error: {
          code: error.code,
          message: error.message,
          detail: error.detail,
        },
      });
    }

    app.log.error(error);
    return reply.status(500).send({
      error: {
        code: 'INTERNAL_ERROR',
        message: '服务端发生未预期错误',
      },
    });
  });

  app.addHook('onClose', async () => {
    if (!options?.prisma) {
      await prisma.$disconnect();
    }
  });

  return app;
}
