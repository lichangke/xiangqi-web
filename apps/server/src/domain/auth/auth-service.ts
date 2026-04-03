import { UserStatus, type Difficulty, type GameSession, type PrismaClient, type User } from '@prisma/client';
import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import type { RecentGameSummary, ThemeKey, UserPreferences } from '@xiangqi-web/shared';
import { config } from '../../config.js';
import { HttpError } from '../../utils/http-error.js';

export type AuthContext = {
  userId: string;
  username: string;
  role: 'USER' | 'ADMIN';
};

type PreferencesShape = {
  theme: string;
  boardOrientation: string;
  discussionDefaultOpen: boolean;
  narrativeStylePreference: string | null;
};

type UserWithPreferences = User & {
  preferences?: PreferencesShape | null;
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

export function toUserPreferences(user: UserWithPreferences): UserPreferences {
  return {
    theme: normalizeTheme(user.preferences?.theme),
    boardOrientation: user.preferences?.boardOrientation ?? 'red-bottom',
    discussionDefaultOpen: user.preferences?.discussionDefaultOpen ?? false,
    narrativeStylePreference: user.preferences?.narrativeStylePreference ?? null,
  };
}

export function toRecentGameSummary(game: GameSession): RecentGameSummary {
  return {
    id: game.id,
    difficulty: game.difficulty as Difficulty,
    status: game.status,
    startedAt: game.startedAt.toISOString(),
    endedAt: game.endedAt?.toISOString() ?? null,
    endedByResign: game.endedByResign,
    undoCount: game.undoCount,
    resultWinner: game.resultWinner === 'red' || game.resultWinner === 'black' ? game.resultWinner : null,
  };
}

export async function listRecentGames(prisma: PrismaClient, userId: string) {
  const games = await prisma.gameSession.findMany({
    where: { userId },
    orderBy: { updatedAt: 'desc' },
    take: 5,
  });

  return games.map(toRecentGameSummary);
}

export async function updateUserTheme(prisma: PrismaClient, userId: string, theme: ThemeKey) {
  const preference = await prisma.userPreference.upsert({
    where: { userId },
    update: { theme },
    create: { userId, theme },
  });

  return {
    theme: normalizeTheme(preference.theme),
    boardOrientation: preference.boardOrientation,
    discussionDefaultOpen: preference.discussionDefaultOpen,
    narrativeStylePreference: preference.narrativeStylePreference,
  } satisfies UserPreferences;
}

function normalizeTheme(theme: string | null | undefined): ThemeKey {
  return theme === 'ink' || theme === 'midnight' ? theme : 'classic';
}
