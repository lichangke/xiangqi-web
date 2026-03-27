import { UserStatus, type PrismaClient } from '@prisma/client';
import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import { config } from '../../config.js';
import { HttpError } from '../../utils/http-error.js';

export type AuthContext = {
  userId: string;
  username: string;
  role: 'USER' | 'ADMIN';
};

export async function validateLogin(prisma: PrismaClient, username: string, password: string) {
  const user = await prisma.user.findUnique({ where: { username }, include: { preferences: true } });

  if (!user) {
    throw new HttpError(401, 'AUTH_INVALID', '用户名或密码错误');
  }

  if (user.status === UserStatus.DISABLED) {
    throw new HttpError(403, 'AUTH_DISABLED', '账号已被禁用');
  }

  const valid = await bcrypt.compare(password, user.passwordHash);
  if (!valid) {
    throw new HttpError(401, 'AUTH_INVALID', '用户名或密码错误');
  }

  return user;
}

export function signToken(payload: AuthContext) {
  return jwt.sign(payload, config.jwtSecret, { expiresIn: '12h' });
}

export function verifyToken(token: string): AuthContext {
  try {
    return jwt.verify(token, config.jwtSecret) as AuthContext;
  } catch {
    throw new HttpError(401, 'AUTH_UNAUTHORIZED', '登录态已失效，请重新登录');
  }
}

export function publicUser(user: {
  id: string;
  username: string;
  role: 'USER' | 'ADMIN';
  status: 'ENABLED' | 'DISABLED';
}) {
  return {
    id: user.id,
    username: user.username,
    role: user.role,
    status: user.status,
  };
}
