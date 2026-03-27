import type { FastifyRequest } from 'fastify';
import type { PrismaClient } from '@prisma/client';
import { UserStatus } from '@prisma/client';
import { verifyToken } from './auth-service.js';
import { HttpError } from '../../utils/http-error.js';

function getToken(request: FastifyRequest) {
  const header = request.headers.authorization;
  if (!header?.startsWith('Bearer ')) {
    throw new HttpError(401, 'AUTH_UNAUTHORIZED', '缺少 Bearer Token');
  }

  return header.slice('Bearer '.length);
}

export async function requireUser(request: FastifyRequest, prisma: PrismaClient) {
  const payload = verifyToken(getToken(request));
  const user = await prisma.user.findUnique({ where: { id: payload.userId } });

  if (!user || user.status === UserStatus.DISABLED) {
    throw new HttpError(403, 'AUTH_DISABLED', '账号不可用');
  }

  return user;
}

export async function requireAdmin(request: FastifyRequest, prisma: PrismaClient) {
  const user = await requireUser(request, prisma);
  if (user.role !== 'ADMIN') {
    throw new HttpError(403, 'AUTH_FORBIDDEN', '需要管理员权限');
  }

  return user;
}
