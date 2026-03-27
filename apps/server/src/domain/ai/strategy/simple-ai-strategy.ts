import { Difficulty } from '@prisma/client';
import { parseFen } from 'elephantops/fen';
import { Xiangqi } from 'elephantops/xiangqi';
import { parseSquare } from 'elephantops/util';
import type { Color, Role } from 'elephantops';
import type { RuleAdapter, RuleMove } from '../../rules/types.js';

const PIECE_SCORES: Record<Role, number> = {
  king: 10_000,
  chariot: 900,
  cannon: 450,
  horse: 400,
  elephant: 200,
  advisor: 200,
  pawn: 100,
};

function createPosition(fen: string) {
  const parsed = parseFen(fen);
  if (parsed.isErr) {
    throw parsed.error;
  }

  const position = Xiangqi.fromSetup(parsed.value);
  if (position.isErr) {
    throw position.error;
  }

  return position.value;
}

function materialScore(fen: string, color: Color) {
  const position = createPosition(fen);
  let score = 0;

  for (const [, piece] of position.board) {
    const value = PIECE_SCORES[piece.role];
    score += piece.color === color ? value : -value;
  }

  return score;
}

function scoreMove(fen: string, move: RuleMove, color: Color, rules: RuleAdapter) {
  const position = createPosition(fen);
  const from = parseSquare(move.from)!;
  const to = parseSquare(move.to)!;
  const capturedPiece = position.board.get(to);
  const applied = rules.applyMove(fen, move);

  if (!applied.ok) {
    return Number.NEGATIVE_INFINITY;
  }

  const nextPosition = createPosition(applied.nextFen);
  const captureScore = capturedPiece ? PIECE_SCORES[capturedPiece.role] * 3 : 0;
  const checkBonus = nextPosition.isCheck() ? 120 : 0;
  const mobilityBonus = -rules.getLegalMoves(applied.nextFen).length * 2;
  const endgameBonus = applied.summary.isCheckmate ? 50_000 : applied.summary.isStalemate ? -200 : 0;

  return materialScore(applied.nextFen, color) + captureScore + checkBonus + mobilityBonus + endgameBonus;
}

export class SimpleAiStrategy {
  constructor(private readonly rules: RuleAdapter) {}

  chooseMove(fen: string, difficulty: Difficulty, aiColor: Color = 'black') {
    const legalMoves = this.rules.getLegalMoves(fen);
    if (legalMoves.length === 0) {
      throw new Error('No legal move available for AI');
    }

    const scoredMoves = legalMoves
      .map((move) => ({
        move,
        score: scoreMove(fen, move, aiColor, this.rules),
      }))
      .sort((left, right) => {
        if (right.score !== left.score) {
          return right.score - left.score;
        }

        return `${left.move.from}${left.move.to}`.localeCompare(`${right.move.from}${right.move.to}`);
      });

    const pickIndex = (() => {
      switch (difficulty) {
        case Difficulty.BEGINNER:
          return Math.min(scoredMoves.length - 1, Math.floor(scoredMoves.length * 0.65));
        case Difficulty.NORMAL:
          return Math.min(scoredMoves.length - 1, Math.floor(scoredMoves.length * 0.35));
        case Difficulty.HARD:
          return Math.min(scoredMoves.length - 1, 1);
        case Difficulty.MASTER:
        default:
          return 0;
      }
    })();

    return {
      move: scoredMoves[pickIndex].move,
      candidateCount: scoredMoves.length,
      topMoves: scoredMoves.slice(0, Math.min(3, scoredMoves.length)).map((entry) => entry.move),
    };
  }
}
