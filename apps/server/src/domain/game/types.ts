import type { GameSession } from '@prisma/client';
import {
  DEFAULT_STORY_THREAD_SUMMARY,
  MOVE_TAGS,
  PRESSURE_SIDES,
  STORY_PHASES,
  TURN_ARCS,
  type DecisionResult,
  type GameActor,
  type GameSummary,
  type SideColor,
  type StoryThreadSummary,
} from '@xiangqi-web/shared';
import type { RuleMove } from '../rules/types.js';

export type PersistedMoveRecord = RuleMove & {
  actor: GameActor;
  turnNumber: number;
  fenBefore: string;
  fenAfter: string;
  pieceType?: string;
  capturedPieceType?: string;
  decision?: DecisionResult | null;
};

function isStoryThreadSummary(value: unknown): value is StoryThreadSummary {
  if (!value || typeof value !== 'object') {
    return false;
  }

  const candidate = value as Record<string, unknown>;
  return STORY_PHASES.includes(candidate.currentPhase as StoryThreadSummary['currentPhase'])
    && typeof candidate.mainConflict === 'string'
    && PRESSURE_SIDES.includes(candidate.pressureSide as StoryThreadSummary['pressureSide'])
    && typeof candidate.recentFocus === 'string'
    && typeof candidate.carryForward === 'string';
}

function isDecisionResult(value: unknown): value is DecisionResult {
  if (!value || typeof value !== 'object') {
    return false;
  }

  const candidate = value as Record<string, unknown>;
  const chosenMove = candidate.chosenMove as Record<string, unknown> | undefined;

  return Boolean(
    chosenMove
    && typeof chosenMove.from === 'string'
    && typeof chosenMove.to === 'string'
    && MOVE_TAGS.includes(candidate.userMoveTag as DecisionResult['userMoveTag'])
    && MOVE_TAGS.includes(candidate.aiMoveTag as DecisionResult['aiMoveTag'])
    && typeof candidate.situationShift === 'string'
    && TURN_ARCS.includes(candidate.turnArc as DecisionResult['turnArc'])
    && isStoryThreadSummary(candidate.storyThreadSummary),
  );
}

function isPersistedMoveRecord(value: unknown): value is PersistedMoveRecord {
  if (!value || typeof value !== 'object') {
    return false;
  }

  const candidate = value as Record<string, unknown>;
  return (
    typeof candidate.from === 'string'
    && typeof candidate.to === 'string'
    && (candidate.actor === 'USER' || candidate.actor === 'AI')
    && typeof candidate.turnNumber === 'number'
    && typeof candidate.fenBefore === 'string'
    && typeof candidate.fenAfter === 'string'
  );
}

function normalizeMoveRecord(record: PersistedMoveRecord): PersistedMoveRecord {
  return {
    actor: record.actor,
    turnNumber: record.turnNumber,
    fenBefore: record.fenBefore,
    fenAfter: record.fenAfter,
    from: record.from,
    to: record.to,
    san: record.san,
    piece: record.piece,
    captured: record.captured,
    pieceType: record.pieceType,
    capturedPieceType: record.capturedPieceType,
    decision: isDecisionResult(record.decision) ? record.decision : undefined,
  };
}

export function parseMoveHistory(serialized: string): PersistedMoveRecord[] {
  try {
    const parsed = JSON.parse(serialized) as unknown;
    if (!Array.isArray(parsed)) {
      return [];
    }

    return parsed.filter(isPersistedMoveRecord).map((item) => normalizeMoveRecord(item));
  } catch {
    return [];
  }
}

export function serializeMoveHistory(history: PersistedMoveRecord[]) {
  return JSON.stringify(history);
}

export function toSideColor(value: string | null | undefined, fallback: SideColor): SideColor {
  if (value === 'red' || value === 'black') {
    return value;
  }

  return fallback;
}

function getLatestStoryThreadSummary(history: PersistedMoveRecord[]) {
  return [...history].reverse().find((record) => record.decision?.storyThreadSummary)?.decision?.storyThreadSummary
    ?? DEFAULT_STORY_THREAD_SUMMARY;
}

export function compactMoves(history: PersistedMoveRecord[]) {
  return history.map(({ actor, from, to, san, piece, captured, turnNumber, pieceType, capturedPieceType, decision }) => ({
    actor,
    from,
    to,
    san,
    piece,
    captured,
    turnNumber,
    pieceType,
    capturedPieceType,
    decision,
  }));
}

export function toGameSummary(
  game: GameSession,
  history: PersistedMoveRecord[],
  currentTurn: 'USER' | 'AI' | null,
  isCheck: boolean,
): GameSummary {
  return {
    id: game.id,
    status: game.status,
    difficulty: game.difficulty,
    currentFen: game.currentFen,
    undoCount: game.undoCount,
    canUndo: game.canUndo,
    moves: compactMoves(history),
    userSide: toSideColor(game.userSide, 'red'),
    aiSide: toSideColor(game.aiSide, 'black'),
    currentTurn,
    isCheck,
    resultWinner: game.resultWinner === 'red' || game.resultWinner === 'black'
      ? game.resultWinner
      : null,
    endedByResign: game.endedByResign,
    storyThreadSummary: getLatestStoryThreadSummary(history),
    startedAt: game.startedAt.toISOString(),
    updatedAt: game.updatedAt.toISOString(),
    endedAt: game.endedAt?.toISOString() ?? null,
  };
}
