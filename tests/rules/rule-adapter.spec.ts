import { describe, expect, it } from 'vitest';
import { XiangqiRuleAdapter } from '../../apps/server/src/domain/rules/xiangqi-rule-adapter.js';

const adapter = new XiangqiRuleAdapter();

describe('XiangqiRuleAdapter baseline', () => {
  it('should generate legal opening moves from initial position', () => {
    const moves = adapter.getLegalMoves(adapter.getInitialFen());
    expect(moves.length).toBeGreaterThan(0);
    expect(moves.some((move) => move.from && move.to)).toBe(true);
  });

  it('should block horse-leg illegal move', () => {
    const fen = '4k4/9/9/9/9/9/9/9/1C1K5/1N7 w - - 0 1';
    const result = adapter.validateMove(fen, { from: 'b1', to: 'c3' });
    expect(result.ok).toBe(false);
  });

  it('should block elephant-eye illegal move', () => {
    const fen = '4k4/9/9/9/9/9/9/9/3K5/2B6 w - - 0 1';
    const result = adapter.validateMove(fen, { from: 'c1', to: 'e3' });
    expect(result.ok).toBe(false);
  });

  it('should block cannon capture without screen', () => {
    const fen = '4k4/9/9/9/9/4C4/9/9/9/4K4 w - - 0 1';
    const result = adapter.validateMove(fen, { from: 'e5', to: 'e10' });
    expect(result.ok).toBe(false);
  });

  it('should block flying general exposure', () => {
    const fen = '4k4/4a4/9/9/9/9/9/9/9/4K4 b - - 0 1';
    const result = adapter.validateMove(fen, { from: 'e9', to: 'f8' });
    expect(result.ok).toBe(false);
  });

  it('should block self-check move', () => {
    const fen = '4k4/4a4/9/9/9/4R4/9/9/9/4K4 b - - 0 1';
    const result = adapter.validateMove(fen, { from: 'e9', to: 'd8' });
    expect(result.ok).toBe(false);
  });
});
