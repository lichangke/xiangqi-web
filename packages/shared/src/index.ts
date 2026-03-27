export const DIFFICULTY_OPTIONS = ['BEGINNER', 'NORMAL', 'HARD', 'MASTER'] as const;
export type Difficulty = (typeof DIFFICULTY_OPTIONS)[number];

export const USER_ROLES = ['USER', 'ADMIN'] as const;
export type UserRole = (typeof USER_ROLES)[number];

export const USER_STATUSES = ['ENABLED', 'DISABLED'] as const;
export type UserStatus = (typeof USER_STATUSES)[number];

export const GAME_STATUSES = ['ONGOING', 'CHECKMATED', 'STALEMATE', 'RESIGNED', 'DRAW'] as const;
export type GameStatus = (typeof GAME_STATUSES)[number];

export const THEMES = ['classic', 'ink', 'midnight'] as const;
export type ThemeKey = (typeof THEMES)[number];

export type AuthUser = {
  id: string;
  username: string;
  role: UserRole;
  status: UserStatus;
};

export type LoginRequest = {
  username: string;
  password: string;
};

export type LoginResponse = {
  token: string;
  user: AuthUser;
};

export type CreateGameRequest = {
  difficulty: Difficulty;
};

export type RuleMove = {
  from: string;
  to: string;
  san?: string;
};

export type GameSummary = {
  id: string;
  status: GameStatus;
  difficulty: Difficulty;
  currentFen: string;
  undoCount: number;
  moves: RuleMove[];
  startedAt: string;
  updatedAt: string;
};

export type ApiErrorShape = {
  code: string;
  message: string;
  detail?: string;
};
