export type MoveInput = {
  from: string;
  to: string;
};

export type RuleMove = MoveInput & {
  san?: string;
  piece?: string;
  captured?: string;
};

export type ValidationResult =
  | { ok: true; move: RuleMove }
  | { ok: false; code: 'ILLEGAL_MOVE'; reason: string };

export type GameStateSummary = {
  isCheck: boolean;
  isCheckmate: boolean;
  isStalemate: boolean;
  isGameOver: boolean;
  nextTurn: 'r' | 'b';
};

export interface RuleAdapter {
  getInitialFen(): string;
  getLegalMoves(fen: string): RuleMove[];
  validateMove(fen: string, input: MoveInput): ValidationResult;
  applyMove(fen: string, input: MoveInput): { ok: true; nextFen: string; move: RuleMove; summary: GameStateSummary } | { ok: false; code: 'ILLEGAL_MOVE'; reason: string };
  getGameState(fen: string): GameStateSummary;
}
