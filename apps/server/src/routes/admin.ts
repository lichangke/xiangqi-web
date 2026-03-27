import type { FastifyInstance } from 'fastify';
import bcrypt from 'bcryptjs';
import { z } from 'zod';
import { requireAdmin } from '../domain/auth/require-auth.js';
import { HttpError } from '../utils/http-error.js';

const createUserSchema = z.object({
  username: z.string().min(3),
  password: z.string().min(6),
  role: z.enum(['USER', 'ADMIN']).default('USER'),
});

const resetPasswordSchema = z.object({
  password: z.string().min(6),
});

const updateStatusSchema = z.object({
  status: z.enum(['ENABLED', 'DISABLED']),
});

export async function adminRoutes(app: FastifyInstance) {
  app.post('/api/admin/users', async (request, reply) => {
    const admin = await requireAdmin(request, app.prisma);
    const parsed = createUserSchema.safeParse(request.body);
    if (!parsed.success) {
      throw new HttpError(400, 'ADMIN_BAD_REQUEST', '用户创建参数不合法');
    }

    const exists = await app.prisma.user.findUnique({ where: { username: parsed.data.username } });
    if (exists) {
      throw new HttpError(409, 'ADMIN_USER_EXISTS', '用户名已存在');
    }

    const passwordHash = await bcrypt.hash(parsed.data.password, 10);
    const user = await app.prisma.user.create({
      data: {
        username: parsed.data.username,
        passwordHash,
        role: parsed.data.role,
        preferences: { create: {} },
      },
    });

    await app.prisma.auditLog.create({
      data: {
        actorUserId: admin.id,
        action: 'admin.user.create',
        targetType: 'user',
        targetId: user.id,
        summary: `创建用户 ${user.username}`,
      },
    });

    return reply.code(201).send({
      user: {
        id: user.id,
        username: user.username,
        role: user.role,
        status: user.status,
      },
    });
  });

  app.patch('/api/admin/users/:userId/status', async (request, reply) => {
    const admin = await requireAdmin(request, app.prisma);
    const parsed = updateStatusSchema.safeParse(request.body);
    if (!parsed.success) {
      throw new HttpError(400, 'ADMIN_BAD_REQUEST', '状态参数不合法');
    }

    const userId = (request.params as { userId: string }).userId;
    const user = await app.prisma.user.update({
      where: { id: userId },
      data: { status: parsed.data.status },
    });

    await app.prisma.auditLog.create({
      data: {
        actorUserId: admin.id,
        action: 'admin.user.status',
        targetType: 'user',
        targetId: user.id,
        summary: `将用户 ${user.username} 状态更新为 ${user.status}`,
      },
    });

    return reply.send({
      user: {
        id: user.id,
        username: user.username,
        role: user.role,
        status: user.status,
      },
    });
  });

  app.post('/api/admin/users/:userId/reset-password', async (request, reply) => {
    const admin = await requireAdmin(request, app.prisma);
    const parsed = resetPasswordSchema.safeParse(request.body);
    if (!parsed.success) {
      throw new HttpError(400, 'ADMIN_BAD_REQUEST', '密码参数不合法');
    }

    const userId = (request.params as { userId: string }).userId;
    const passwordHash = await bcrypt.hash(parsed.data.password, 10);
    const user = await app.prisma.user.update({
      where: { id: userId },
      data: { passwordHash },
    });

    await app.prisma.auditLog.create({
      data: {
        actorUserId: admin.id,
        action: 'admin.user.password-reset',
        targetType: 'user',
        targetId: user.id,
        summary: `重置用户 ${user.username} 密码`,
      },
    });

    return reply.send({ success: true });
  });
}
