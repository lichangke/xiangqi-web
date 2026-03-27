import { describe, expect, it } from 'vitest';
import type { GameSummary } from '@xiangqi-web/shared';
import {
  THEME_OPTIONS,
  buildCheckEvent,
  buildErrorEvent,
  buildFinishEvent,
  buildNarrativeTurns,
  buildUndoEvent,
} from '../../apps/web/src/presentation.js';

function createGame(overrides: Partial<GameSummary> = {}): GameSummary {
  return {
    id: 'game-1',
    status: 'ONGOING',
    difficulty: 'NORMAL',
    currentFen: 'fen',
    undoCount: 0,
    canUndo: true,
    moves: [
      { actor: 'USER', turnNumber: 1, from: 'b3', to: 'b4' },
      { actor: 'AI', turnNumber: 1, from: 'h8', to: 'h7' },
      { actor: 'USER', turnNumber: 2, from: 'c3', to: 'c4' },
      { actor: 'AI', turnNumber: 2, from: 'g7', to: 'g6' },
    ],
    userSide: 'red',
    aiSide: 'black',
    currentTurn: 'USER',
    isCheck: false,
    resultWinner: null,
    endedByResign: false,
    startedAt: new Date('2026-03-27T02:00:00.000Z').toISOString(),
    updatedAt: new Date('2026-03-27T02:05:00.000Z').toISOString(),
    endedAt: null,
    ...overrides,
  };
}

describe('web presentation helpers', () => {
  it('should expose three immediate theme options', () => {
    expect(THEME_OPTIONS.map((item) => item.value)).toEqual(['classic', 'ink', 'midnight']);
  });

  it('should build unified narrative turns with four ordered segments', () => {
    const turns = buildNarrativeTurns(createGame(), 'classic');

    expect(turns).toHaveLength(2);
    expect(turns[0].title).toBe('第 1 回合');
    expect(turns[1].summary).toContain('AI 应对 g7 → g6');
    expect(turns[0].segments.map((segment) => segment.kind)).toEqual(['review', 'voices', 'consensus', 'decision']);
    expect(turns[0].segments[0].label).toBe('简评');
    expect(turns[0].segments[3].text).toContain('最终落子');
  });

  it('should append check pressure copy only to the latest ongoing turn', () => {
    const turns = buildNarrativeTurns(createGame({ isCheck: true }), 'midnight');

    expect(turns[0].summary).not.toContain('将军');
    expect(turns[1].summary).toContain('将军');
    expect(turns[1].segments[0].text).toContain('将军');
  });

  it('should distinguish illegal move prompts from generic system errors', () => {
    const illegal = buildErrorEvent({ code: 'ILLEGAL_MOVE', message: '非法', detail: '马腿被卡住。' }, 'b3 → b8');
    const generic = buildErrorEvent({ code: 'SERVER_ERROR', message: '服务异常' });

    expect(illegal.type).toBe('illegal');
    expect(illegal.meta).toContain('不计回合');
    expect(illegal.body).toContain('马腿被卡住');
    expect(generic.type).toBe('system');
    expect(generic.tone).toBe('danger');
  });

  it('should build dedicated undo, check, resign and finish cards', () => {
    const baseGame = createGame();
    const undo = buildUndoEvent(2);
    const check = buildCheckEvent(createGame({ isCheck: true }));
    const resign = buildFinishEvent(createGame({ status: 'RESIGNED', endedByResign: true, resultWinner: 'black' }));
    const checkmated = buildFinishEvent(createGame({ status: 'CHECKMATED', resultWinner: 'red', endedAt: new Date().toISOString() }));
    const draw = buildFinishEvent(createGame({ status: 'DRAW', endedAt: new Date().toISOString() }));

    expect(undo.type).toBe('undo');
    expect(undo.body).toContain('第 2 回合之前');
    expect(check.type).toBe('check');
    expect(check.meta).toBe('第 2 回合');
    expect(resign.type).toBe('resign');
    expect(resign.title).toBe('认输事件');
    expect(checkmated.tone).toBe('success');
    expect(checkmated.meta).toBe('将死');
    expect(draw.tone).toBe('info');
    expect(draw.body).toContain('和局');
    expect(baseGame.status).toBe('ONGOING');
  });
});
