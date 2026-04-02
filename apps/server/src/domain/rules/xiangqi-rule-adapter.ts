import { INITIAL_FEN, makeFen, parseFen } from 'elephantops/fen';
import { Xiangqi } from 'elephantops/xiangqi';
import { makeSquare, makeUci, parseSquare, parseUci } from 'elephantops/util';
import type { MoveInput, RuleAdapter, RuleMove, ValidationResult } from './types.js';

type BoardPiece = {
  role: 'king' | 'advisor' | 'elephant' | 'horse' | 'chariot' | 'cannon' | 'pawn';
  color: 'red' | 'black';
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

function toPieceCode(piece: BoardPiece | undefined) {
  if (!piece) {
    return undefined;
  }

  const code = {
    king: 'k',
    advisor: 'a',
    elephant: 'b',
    horse: 'n',
    chariot: 'r',
    cannon: 'c',
    pawn: 'p',
  }[piece.role];

  return piece.color === 'red' ? code.toUpperCase() : code;
}

function toRuleMove(fen: string, from: number, to: number): RuleMove {
  const position = createPosition(fen);
  const piece = position.board.get(from) as BoardPiece | undefined;
  const captured = position.board.get(to) as BoardPiece | undefined;
  const move = { from, to };

  return {
    from: makeSquare(from),
    to: makeSquare(to),
    san: makeUci(move),
    piece: toPieceCode(piece),
    captured: toPieceCode(captured),
  };
}

function illegal(reason: string): ValidationResult {
  return { ok: false, code: 'ILLEGAL_MOVE', reason };
}

function toTurn(color: 'red' | 'black'): 'r' | 'b' {
  return color === 'red' ? 'r' : 'b';
}

export class XiangqiRuleAdapter implements RuleAdapter {
  getInitialFen() {
    return INITIAL_FEN;
  }

  getLegalMoves(fen: string) {
    const position = createPosition(fen);
    return [...position.allDests().entries()].flatMap(([from, destinations]) =>
      [...destinations].map((to) => toRuleMove(fen, from, to)),
    );
  }

  validateMove(fen: string, input: MoveInput): ValidationResult {
    const from = parseSquare(input.from);
    const to = parseSquare(input.to);

    if (from === undefined || to === undefined) {
      return illegal('坐标格式不合法');
    }

    const position = createPosition(fen);
    const move = { from, to };
    if (!position.isLegal(move)) {
      return illegal('该走法不符合当前棋规');
    }

    return {
      ok: true,
      move: toRuleMove(fen, from, to),
    };
  }

  applyMove(fen: string, input: MoveInput) {
    const validation = this.validateMove(fen, input);
    if (!validation.ok) {
      return validation;
    }

    const position = createPosition(fen);
    const move = parseUci(`${input.from}${input.to}`)!;

    position.play(move);
    return {
      ok: true as const,
      nextFen: makeFen(position.toSetup()),
      move: validation.move,
      summary: this.getGameState(makeFen(position.toSetup())),
    };
  }

  getGameState(fen: string) {
    const position = createPosition(fen);
    return {
      isCheck: position.isCheck(),
      isCheckmate: position.isCheckmate(),
      isStalemate: position.isStalemate(),
      isGameOver: position.isEnd(),
      nextTurn: toTurn(position.turn),
    };
  }
}
