import type { PrismaClient, ModelConfig, RegistrationMode, RuntimePolicy } from '@prisma/client';
import { UserStatus, type Difficulty, type GameSession, type User } from '@prisma/client';
import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import type {
  AdminModelConfig,
  AuditSummaryItem,
  ModelConfigKey,
  ModelRuntimeStatus,
  RecentGameSummary,
  RuntimePolicySummary,
  ThemeKey,
  UserPreferences,
} from '@xiangqi-web/shared';
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

const DEFAULT_MODEL_CONFIGS: Record<ModelConfigKey, Omit<AdminModelConfig, 'apiKeyMaskedHint' | 'createdAt' | 'updatedAt' | 'enabled' | 'isConfigured'>> = {
  decision: {
    configKey: 'decision',
    modelName: '',
    baseUrl: '',
    thinkingLevel: 'normal',
  },
  narrative: {
    configKey: 'narrative',
    modelName: '',
    baseUrl: '',
    thinkingLevel: 'normal',
  },
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

export async function listAdminModelConfigs(prisma: PrismaClient) {
  const configs = await prisma.modelConfig.findMany({ orderBy: { configKey: 'asc' } });
  return ensureModelConfigShapes(configs);
}

export async function getModelRuntimeStatus(prisma: PrismaClient): Promise<ModelRuntimeStatus> {
  const configs = await listAdminModelConfigs(prisma);
  const enabledConfigs = configs.filter((config) => config.enabled && config.isConfigured);
  const configuredKeys = configs.filter((config) => config.isConfigured).map((config) => config.configKey);

  let message: string | null = null;
  if (!enabledConfigs.length) {
    const missingConfigured = configs.filter((config) => !config.isConfigured).map((config) => config.configKey);
    if (missingConfigured.length === configs.length) {
      message = '当前尚未完成任何模型配置，请先到后台填写模型名称、Base URL 和 API Key。';
    } else {
      message = '当前模型配置尚未启用，前台新开对局会提示管理员先完成启用。';
    }
  }

  return {
    hasAnyEnabledModelConfig: enabledConfigs.length > 0,
    decisionConfigured: configs.some((config) => config.configKey === 'decision' && config.isConfigured),
    narrativeConfigured: configs.some((config) => config.configKey === 'narrative' && config.isConfigured),
    configuredKeys,
    message,
  };
}

export async function upsertAdminModelConfig(
  prisma: PrismaClient,
  actorUserId: string,
  configKey: ModelConfigKey,
  payload: {
    modelName: string;
    baseUrl: string;
    apiKey?: string;
    thinkingLevel: string;
    enabled: boolean;
  },
): Promise<AdminModelConfig> {
  const nextModelName = payload.modelName.trim();
  const nextBaseUrl = payload.baseUrl.trim();
  const nextApiKey = payload.apiKey?.trim() ?? '';
  const nextThinkingLevel = payload.thinkingLevel.trim() || 'normal';

  if (!nextModelName) {
    throw new HttpError(400, 'ADMIN_BAD_REQUEST', '模型名称不能为空');
  }

  if (!nextBaseUrl) {
    throw new HttpError(400, 'ADMIN_BAD_REQUEST', 'Base URL 不能为空');
  }

  const existing = await prisma.modelConfig.findUnique({ where: { configKey } });
  const maskedHint = nextApiKey ? maskApiKey(nextApiKey) : (existing?.apiKeyMaskedHint ?? '');
  const isConfigured = Boolean(nextModelName && nextBaseUrl && (nextApiKey || existing?.apiKeyMaskedHint));

  if (!isConfigured) {
    throw new HttpError(400, 'ADMIN_BAD_REQUEST', '首次保存模型配置时必须提供 API Key');
  }

  const record = await prisma.modelConfig.upsert({
    where: { configKey },
    update: {
      modelName: nextModelName,
      baseUrl: nextBaseUrl,
      apiKeyMaskedHint: maskedHint,
      thinkingLevel: nextThinkingLevel,
      enabled: payload.enabled,
      updatedById: actorUserId,
      createdById: existing?.createdById ?? actorUserId,
    },
    create: {
      configKey,
      modelName: nextModelName,
      baseUrl: nextBaseUrl,
      apiKeyMaskedHint: maskedHint,
      thinkingLevel: nextThinkingLevel,
      enabled: payload.enabled,
      createdById: actorUserId,
      updatedById: actorUserId,
    },
  });

  await prisma.auditLog.create({
    data: {
      actorUserId,
      action: 'admin.model-config.upsert',
      targetType: 'model-config',
      targetId: record.id,
      summary: `更新 ${configKey} 模型配置（${record.enabled ? '已启用' : '未启用'}）`,
      payload: JSON.stringify({
        configKey,
        modelName: record.modelName,
        baseUrl: record.baseUrl,
        thinkingLevel: record.thinkingLevel,
        enabled: record.enabled,
        apiKeyUpdated: Boolean(nextApiKey),
      }),
    },
  });

  return toAdminModelConfig(record);
}

export async function getRuntimePolicy(prisma: PrismaClient): Promise<RuntimePolicySummary> {
  const policy = await prisma.runtimePolicy.upsert({
    where: { policyKey: 'system' },
    update: {},
    create: {
      policyKey: 'system',
      maxConcurrentAiGames: 20,
      maxOngoingGamesPerUser: 1,
      maxUndoPerGame: 5,
      registrationMode: 'CLOSED',
    },
  });

  return toRuntimePolicySummary(policy);
}

export async function updateRuntimePolicy(
  prisma: PrismaClient,
  actorUserId: string,
  payload: {
    maxConcurrentAiGames: number;
    maxOngoingGamesPerUser: number;
    registrationMode: RegistrationMode;
    maxUndoPerGame: number;
  },
): Promise<RuntimePolicySummary> {
  const policy = await prisma.runtimePolicy.upsert({
    where: { policyKey: 'system' },
    update: {
      maxConcurrentAiGames: payload.maxConcurrentAiGames,
      maxOngoingGamesPerUser: payload.maxOngoingGamesPerUser,
      registrationMode: payload.registrationMode,
      maxUndoPerGame: payload.maxUndoPerGame,
    },
    create: {
      policyKey: 'system',
      maxConcurrentAiGames: payload.maxConcurrentAiGames,
      maxOngoingGamesPerUser: payload.maxOngoingGamesPerUser,
      registrationMode: payload.registrationMode,
      maxUndoPerGame: payload.maxUndoPerGame,
    },
  });

  await prisma.auditLog.create({
    data: {
      actorUserId,
      action: 'admin.runtime-policy.update',
      targetType: 'runtime-policy',
      targetId: policy.id,
      summary: '更新系统运行策略',
      payload: JSON.stringify({
        maxConcurrentAiGames: policy.maxConcurrentAiGames,
        maxOngoingGamesPerUser: policy.maxOngoingGamesPerUser,
        registrationMode: policy.registrationMode,
        maxUndoPerGame: policy.maxUndoPerGame,
      }),
    },
  });

  return toRuntimePolicySummary(policy);
}

export async function listAuditSummary(prisma: PrismaClient, limit = 10): Promise<AuditSummaryItem[]> {
  const logs = await prisma.auditLog.findMany({
    orderBy: { createdAt: 'desc' },
    take: limit,
    include: { actor: true },
  });

  return logs.map((log) => ({
    id: log.id,
    action: log.action,
    targetType: log.targetType,
    targetId: log.targetId ?? null,
    summary: log.summary,
    actorUsername: log.actor?.username ?? null,
    createdAt: log.createdAt.toISOString(),
  }));
}

function normalizeTheme(theme: string | null | undefined): ThemeKey {
  return theme === 'ink' || theme === 'midnight' ? theme : 'classic';
}

function ensureModelConfigShapes(records: ModelConfig[]): AdminModelConfig[] {
  return (Object.keys(DEFAULT_MODEL_CONFIGS) as ModelConfigKey[]).map((configKey) => {
    const existing = records.find((record) => record.configKey === configKey);
    return existing ? toAdminModelConfig(existing) : buildDefaultAdminModelConfig(configKey);
  });
}

function toAdminModelConfig(record: ModelConfig): AdminModelConfig {
  return {
    configKey: record.configKey as ModelConfigKey,
    modelName: record.modelName,
    baseUrl: record.baseUrl,
    apiKeyMaskedHint: record.apiKeyMaskedHint,
    thinkingLevel: record.thinkingLevel,
    enabled: record.enabled,
    isConfigured: Boolean(record.modelName && record.baseUrl && record.apiKeyMaskedHint),
    createdAt: record.createdAt.toISOString(),
    updatedAt: record.updatedAt.toISOString(),
  };
}

function buildDefaultAdminModelConfig(configKey: ModelConfigKey): AdminModelConfig {
  const defaults = DEFAULT_MODEL_CONFIGS[configKey];
  return {
    ...defaults,
    apiKeyMaskedHint: '',
    enabled: false,
    isConfigured: false,
    createdAt: null,
    updatedAt: null,
  };
}

function toRuntimePolicySummary(policy: RuntimePolicy): RuntimePolicySummary {
  return {
    policyKey: policy.policyKey,
    maxConcurrentAiGames: policy.maxConcurrentAiGames,
    maxOngoingGamesPerUser: policy.maxOngoingGamesPerUser,
    registrationMode: policy.registrationMode as RuntimePolicySummary['registrationMode'],
    maxUndoPerGame: policy.maxUndoPerGame,
    createdAt: policy.createdAt.toISOString(),
    updatedAt: policy.updatedAt.toISOString(),
  };
}

function maskApiKey(value: string) {
  const clean = value.trim();
  if (clean.length <= 8) {
    return `${clean.slice(0, 2)}***${clean.slice(-2)}`;
  }

  return `${clean.slice(0, 4)}***${clean.slice(-4)}`;
}
