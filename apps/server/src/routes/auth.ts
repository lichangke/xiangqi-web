import type { FastifyInstance } from 'fastify';
import { z } from 'zod';
import {
  getModelRuntimeStatus,
  listRecentGames,
  publicUser,
  signToken,
  toUserPreferences,
  updateUserTheme,
  validateLogin,
} from '../domain/auth/auth-service.js';
import { requireUser } from '../domain/auth/require-auth.js';
import { HttpError } from '../utils/http-error.js';

const loginSchema = z.object({
  username: z.string().min(1),
  password: z.string().min(1),
});

const updatePreferencesSchema = z.object({
  theme: z.enum(['classic', 'ink', 'midnight']),
});

export async function authRoutes(app: FastifyInstance) {
  app.post('/api/auth/login', async (request, reply) => {
    const parsed = loginSchema.safeParse(request.body);
    if (!parsed.success) {
      throw new HttpError(400, 'AUTH_BAD_REQUEST', '登录参数不完整');
    }

    const user = await validateLogin(app.prisma, parsed.data.username, parsed.data.password);
    const token = signToken({ userId: user.id, username: user.username, role: user.role });
    const [recentGames, modelRuntimeStatus] = await Promise.all([
      listRecentGames(app.prisma, user.id),
      getModelRuntimeStatus(app.prisma),
    ]);

    return reply.send({
      token,
      user: publicUser(user),
      preferences: toUserPreferences(user),
      recentGames,
      modelRuntimeStatus,
    });
  });

  app.get('/api/auth/me', async (request, reply) => {
    const user = await requireUser(request, app.prisma, { includePreferences: true });
    const [recentGames, modelRuntimeStatus] = await Promise.all([
      listRecentGames(app.prisma, user.id),
      getModelRuntimeStatus(app.prisma),
    ]);
    return reply.send({
      user: publicUser(user),
      preferences: toUserPreferences(user),
      recentGames,
      modelRuntimeStatus,
    });
  });

  app.patch('/api/auth/preferences', async (request, reply) => {
    const user = await requireUser(request, app.prisma);
    const parsed = updatePreferencesSchema.safeParse(request.body);
    if (!parsed.success) {
      throw new HttpError(400, 'AUTH_BAD_REQUEST', '主题参数不完整');
    }

    const preferences = await updateUserTheme(app.prisma, user.id, parsed.data.theme);
    return reply.send({ preferences });
  });
}
