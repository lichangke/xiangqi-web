import type { FastifyInstance } from 'fastify';
import { z } from 'zod';
import { publicUser, signToken, validateLogin } from '../domain/auth/auth-service.js';
import { requireUser } from '../domain/auth/require-auth.js';
import { HttpError } from '../utils/http-error.js';

const loginSchema = z.object({
  username: z.string().min(1),
  password: z.string().min(1),
});

export async function authRoutes(app: FastifyInstance) {
  app.post('/api/auth/login', async (request, reply) => {
    const parsed = loginSchema.safeParse(request.body);
    if (!parsed.success) {
      throw new HttpError(400, 'AUTH_BAD_REQUEST', '登录参数不完整');
    }

    const user = await validateLogin(app.prisma, parsed.data.username, parsed.data.password);
    const token = signToken({ userId: user.id, username: user.username, role: user.role });

    return reply.send({
      token,
      user: publicUser(user),
    });
  });

  app.get('/api/auth/me', async (request, reply) => {
    const user = await requireUser(request, app.prisma);
    return reply.send({ user: publicUser(user) });
  });
}
