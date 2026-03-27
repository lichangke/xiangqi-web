import type { GameSession } from '@prisma/client';
import type { GameActor, GameSummary, SideColor } from '@xiangqi-web/shared';
import type { RuleMove } from '../rules/types.js';

export type PersistedMoveRecord = RuleMove & {
  actor: GameActor;
  turnNumber: number;
  fenBefore: string;
  fenAfter: string;
};

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

export function parseMoveHistory(serialized: string): PersistedMoveRecord[] {
  try {
    const parsed = JSON.parse(serialized) as unknown;
    if (!Array.isArray(parsed)) {
      return [];
    }

    return parsed.filter(isPersistedMoveRecord);
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

export function compactMoves(history: PersistedMoveRecord[]) {
  return history.map(({ actor, from, to, san, turnNumber }) => ({
    actor,
    from,
    to,
    san,
    turnNumber,
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
    startedAt: game.startedAt.toISOString(),
    updatedAt: game.updatedAt.toISOString(),
    endedAt: game.endedAt?.toISOString() ?? null,
  };
}
