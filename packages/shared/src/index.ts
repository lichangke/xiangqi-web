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

export const MODEL_CONFIG_KEYS = ['decision', 'narrative'] as const;
export type ModelConfigKey = (typeof MODEL_CONFIG_KEYS)[number];

export const MOVE_TAGS = ['试探', '抢位', '压迫', '解围', '护驾', '换子', '佯动', '追击', '收束'] as const;
export type MoveTag = (typeof MOVE_TAGS)[number];

export const TURN_ARCS = ['试探铺垫', '抢势加码', '压力升级', '攻守换边', '稳阵解围', '收束临门'] as const;
export type TurnArc = (typeof TURN_ARCS)[number];

export const STORY_PHASES = ['试探期', '抢势期', '对压期', '解围期', '收束期'] as const;
export type StoryPhase = (typeof STORY_PHASES)[number];

export const PRESSURE_SIDES = ['RED', 'BLACK', 'BALANCED'] as const;
export type PressureSide = (typeof PRESSURE_SIDES)[number];

export const RISK_LEVELS = ['low', 'medium', 'high'] as const;
export type RiskLevel = (typeof RISK_LEVELS)[number];

export const NARRATIVE_ITEM_TYPES = ['turn', 'event'] as const;
export type NarrativeItemType = (typeof NARRATIVE_ITEM_TYPES)[number];

export const SPECIAL_EVENT_TYPES = ['illegal_move', 'undo', 'resign', 'check', 'finish'] as const;
export type SpecialEventType = (typeof SPECIAL_EVENT_TYPES)[number];

export const EVENT_SEMANTIC_TAGS = ['军议否决', '推演回拨', '正面施压', '主动收局', '胜负已定', '规则裁断'] as const;
export type EventSemanticTag = (typeof EVENT_SEMANTIC_TAGS)[number];

export const FINISH_REASONS = ['checkmate', 'resign', 'rule_settlement'] as const;
export type FinishReason = (typeof FINISH_REASONS)[number];

export const NARRATIVE_TONES = ['calm', 'tense', 'warning', 'decisive', 'elegiac'] as const;
export type NarrativeTone = (typeof NARRATIVE_TONES)[number];

export const NARRATIVE_HIGHLIGHT_LEVELS = ['low', 'medium', 'high'] as const;
export type NarrativeHighlightLevel = (typeof NARRATIVE_HIGHLIGHT_LEVELS)[number];

export const NARRATIVE_SEGMENT_KINDS = ['review', 'voices', 'consensus', 'decision', 'event', 'impact', 'closure'] as const;
export type NarrativeSegmentKind = (typeof NARRATIVE_SEGMENT_KINDS)[number];

export type AuthUser = {
  id: string;
  username: string;
  role: UserRole;
  status: UserStatus;
};

export type UserPreferences = {
  theme: ThemeKey;
  boardOrientation: string;
  discussionDefaultOpen: boolean;
  narrativeStylePreference: string | null;
};

export type RecentGameSummary = {
  id: string;
  difficulty: Difficulty;
  status: GameStatus;
  startedAt: string;
  endedAt: string | null;
  endedByResign: boolean;
  undoCount: number;
  resultWinner: SideColor | null;
};

export type AdminModelConfig = {
  configKey: ModelConfigKey;
  modelName: string;
  baseUrl: string;
  apiKeyMaskedHint: string;
  thinkingLevel: string;
  enabled: boolean;
  isConfigured: boolean;
  createdAt: string | null;
  updatedAt: string | null;
};

export type ModelRuntimeStatus = {
  hasAnyEnabledModelConfig: boolean;
  decisionConfigured: boolean;
  narrativeConfigured: boolean;
  configuredKeys: ModelConfigKey[];
  message: string | null;
};

export type LoginRequest = {
  username: string;
  password: string;
};

export type LoginResponse = {
  token: string;
  user: AuthUser;
  preferences: UserPreferences;
  recentGames: RecentGameSummary[];
  modelRuntimeStatus: ModelRuntimeStatus;
};

export type GetMeResponse = {
  user: AuthUser;
  preferences: UserPreferences;
  recentGames: RecentGameSummary[];
  modelRuntimeStatus: ModelRuntimeStatus;
};

export type UpdatePreferencesRequest = {
  theme: ThemeKey;
};

export type UpdatePreferencesResponse = {
  preferences: UserPreferences;
};

export type GetAdminModelConfigsResponse = {
  configs: AdminModelConfig[];
  modelRuntimeStatus: ModelRuntimeStatus;
};

export type UpdateAdminModelConfigRequest = {
  modelName: string;
  baseUrl: string;
  apiKey?: string;
  thinkingLevel: string;
  enabled: boolean;
};

export type UpdateAdminModelConfigResponse = {
  config: AdminModelConfig;
  modelRuntimeStatus: ModelRuntimeStatus;
};

export type CreateGameRequest = {
  difficulty: Difficulty;
};

export type MoveRequest = {
  from: string;
  to: string;
};

export type RuleMove = {
  from: string;
  to: string;
  san?: string;
  piece?: string;
  captured?: string;
};

export type GameActor = 'USER' | 'AI';
export type SideColor = 'red' | 'black';
export type PlayerTurn = GameActor | null;

export type StoryThreadSummary = {
  currentPhase: StoryPhase;
  mainConflict: string;
  pressureSide: PressureSide;
  recentFocus: string;
  carryForward: string;
};

export const DEFAULT_STORY_THREAD_SUMMARY: StoryThreadSummary = {
  currentPhase: '试探期',
  mainConflict: '双方仍在摸清彼此节拍，主线尚未完全定型。',
  pressureSide: 'BALANCED',
  recentFocus: '开局试探',
  carryForward: '下一回合先看谁能把试探落成真正的压迫。',
};

export type DecisionResult = {
  chosenMove: RuleMove;
  userMoveTag: MoveTag;
  aiMoveTag: MoveTag;
  situationShift: string;
  turnArc: TurnArc;
  storyThreadSummary: StoryThreadSummary;
  highlightReason?: string[];
  riskLevel?: RiskLevel;
  pressureSide?: PressureSide;
};

export type NarrativeResponseSegment = {
  kind: NarrativeSegmentKind;
  label: string;
  text: string;
};

export type NarrativeResponseEnvelope = {
  schemaVersion: 'v1';
  itemType: NarrativeItemType;
  title: string;
  summary: string;
  tone: NarrativeTone;
  highlightLevel: NarrativeHighlightLevel;
  segments: NarrativeResponseSegment[];
  displayHints?: Record<string, unknown>;
};

export type NarrativeTurnPayload = {
  turnNumber: number;
  userMove: RuleMove & {
    pieceType?: string;
    semanticTag: MoveTag;
  };
  aiMove: (RuleMove & {
    pieceType?: string;
    semanticTag: MoveTag;
  }) | null;
  capture: boolean;
  checkState: {
    before: boolean;
    after: boolean;
  };
  situationShift: string;
  turnArc: TurnArc;
  highlightReason?: string[];
  storyThreadSummary: StoryThreadSummary;
  narrativeGoal: string;
};

export type NarrativeEventPayload = {
  eventType: SpecialEventType;
  eventAtTurn: number;
  eventActor: GameActor | 'SYSTEM';
  relatedMove?: RuleMove & {
    pieceType?: string;
  };
  eventReason: string;
  eventSemanticTag: EventSemanticTag;
  stateImpact: string;
  narrativeGoal: string;
  storyThreadSummary: StoryThreadSummary;
  finishReason?: FinishReason;
  extensions?: Record<string, unknown>;
};

export type NarrativeRequestEnvelope = {
  schemaVersion: 'v1';
  requestId: string;
  gameContext: {
    gameId: string;
    turnNumber: number;
    userSide: SideColor;
    aiSide: SideColor;
    difficulty: Difficulty;
    gameStatus: GameStatus;
    isCheck: boolean;
    isGameEnding: boolean;
    storyThreadSummary: StoryThreadSummary;
  };
  themeContext: {
    storyThemeId: string;
    storyThemeName: string;
    themeTone: string;
    doNotUseStyles: string[];
  };
  roleContext: {
    activeRoles: string[];
    roleCardsVersion: 'v1';
    roleHints: string[];
  };
  itemType: NarrativeItemType;
  itemPayload: NarrativeTurnPayload | NarrativeEventPayload;
  constraints: {
    maxChars: number;
    segmentCount: number;
    language: 'zh-CN';
    mustStayGroundedInFacts: true;
    allowWorldExpansion: false;
    mustReturnJson: true;
  };
  fallbackPolicy: {
    fallbackMode: 'template-minimal';
    timeoutMs: number;
    onSchemaInvalid: 'fallback';
    onEmptyResponse: 'fallback';
  };
};

export type GameMoveRecord = RuleMove & {
  actor: GameActor;
  turnNumber: number;
  pieceType?: string;
  capturedPieceType?: string;
  decision?: DecisionResult | null;
};

export type GameSummary = {
  id: string;
  status: GameStatus;
  difficulty: Difficulty;
  currentFen: string;
  undoCount: number;
  canUndo: boolean;
  moves: GameMoveRecord[];
  userSide: SideColor;
  aiSide: SideColor;
  currentTurn: PlayerTurn;
  isCheck: boolean;
  resultWinner: SideColor | null;
  endedByResign: boolean;
  storyThreadSummary: StoryThreadSummary;
  startedAt: string;
  updatedAt: string;
  endedAt: string | null;
};

export type CreateGameResponse = {
  game: GameSummary;
};

export type GetCurrentGameResponse = {
  game: GameSummary | null;
};

export type SubmitMoveResponse = {
  game: GameSummary;
  userMove: GameMoveRecord;
  aiMove: GameMoveRecord | null;
};

export type UndoGameResponse = {
  game: GameSummary;
  revertedTurnNumber: number;
};

export type ResignGameResponse = {
  game: GameSummary;
};

export type ApiErrorShape = {
  code: string;
  message: string;
  detail?: string;
};
