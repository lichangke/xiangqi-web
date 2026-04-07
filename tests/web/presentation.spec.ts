import { describe, expect, it, vi } from 'vitest';
import type { GameSummary, NarrativeRequestEnvelope, NarrativeResponseEnvelope } from '@xiangqi-web/shared';
import {
  THEME_OPTIONS,
  buildCheckEvent,
  buildErrorEvent,
  buildFinishEvent,
  buildTimelineItems,
  buildUndoEvent,
  resolveTimelineItem,
} from '../../apps/web/src/presentation.js';
import { parseNarrativeResponse } from '../../apps/server/src/domain/ai/narrative/narrative-fallback.js';

function createGame(overrides: Partial<GameSummary> = {}): GameSummary {
  return {
    id: 'game-1',
    status: 'ONGOING',
    difficulty: 'NORMAL',
    currentFen: 'fen',
    undoCount: 0,
    canUndo: true,
    moves: [
      {
        actor: 'USER',
        turnNumber: 1,
        from: 'b3',
        to: 'b4',
        piece: 'P',
        pieceType: '兵',
      },
      {
        actor: 'AI',
        turnNumber: 1,
        from: 'h8',
        to: 'h7',
        piece: 'p',
        pieceType: '卒',
        decision: {
          chosenMove: { from: 'h8', to: 'h7', piece: 'p' },
          userMoveTag: '试探',
          aiMoveTag: '压迫',
          situationShift: '黑方随即把节奏往边线压力上推了一格。',
          turnArc: '压力升级',
          storyThreadSummary: {
            currentPhase: '对压期',
            mainConflict: '黑方正在把局势往边线挤压，红方还没真正缓过气。',
            pressureSide: 'BLACK',
            recentFocus: '边线压力',
            carryForward: '下一回合不要急着写翻盘，先看红方如何减压。',
          },
          highlightReason: ['吃子压缩空间'],
          riskLevel: 'medium',
          pressureSide: 'BLACK',
        },
      },
      {
        actor: 'USER',
        turnNumber: 2,
        from: 'c3',
        to: 'c4',
        piece: 'P',
        pieceType: '兵',
      },
      {
        actor: 'AI',
        turnNumber: 2,
        from: 'g7',
        to: 'g6',
        piece: 'c',
        pieceType: '炮',
        decision: {
          chosenMove: { from: 'g7', to: 'g6', piece: 'c' },
          userMoveTag: '抢位',
          aiMoveTag: '压迫',
          situationShift: '红方刚抢到一点空间，黑方立刻把压迫线重新校准。',
          turnArc: '压力升级',
          storyThreadSummary: {
            currentPhase: '对压期',
            mainConflict: '双方都在争谁能先把试探落成实压，黑方当前更占话语权。',
            pressureSide: 'BLACK',
            recentFocus: '中路压力',
            carryForward: '下一回合继续强调红方先解压，再谈反抢。',
          },
          highlightReason: ['将军'],
          riskLevel: 'high',
          pressureSide: 'BLACK',
        },
      },
    ],
    userSide: 'red',
    aiSide: 'black',
    currentTurn: 'USER',
    isCheck: true,
    resultWinner: null,
    endedByResign: false,
    storyThreadSummary: {
      currentPhase: '对压期',
      mainConflict: '双方都在争谁能先把试探落成实压，黑方当前更占话语权。',
      pressureSide: 'BLACK',
      recentFocus: '中路压力',
      carryForward: '下一回合继续强调红方先解压，再谈反抢。',
    },
    startedAt: new Date('2026-03-27T02:00:00.000Z').toISOString(),
    updatedAt: new Date('2026-03-27T02:05:00.000Z').toISOString(),
    endedAt: null,
    ...overrides,
  };
}

describe('server narrative parser compatibility', () => {
  it('should normalize provider turn payload into NarrativeResponseEnvelope', () => {
    const parsed = parseNarrativeResponse({
      itemType: 'turn',
      title: '中线先试',
      summary: '红兵进一，黑卒应一步。',
      segments: [
        { type: 'narration', text: '红兵先拱中路，黑卒随即顶住。' },
        { type: 'roleLine', role: '车', text: '先对中线，不急冲。' },
        { type: 'roleLine', role: '马', text: '都在试步，还没露底。' },
      ],
      tags: ['试探铺垫', '中线对位'],
      grounding: {
        userMove: { from: 'e3', to: 'e4', pieceType: '兵' },
        aiMove: { from: 'e7', to: 'e6', pieceType: '卒' },
      },
    }, 'turn');

    expect(parsed).not.toBeNull();
    expect(parsed?.schemaVersion).toBe('v1');
    expect(parsed?.itemType).toBe('turn');
    expect(parsed?.segments).toHaveLength(4);
    expect(parsed?.segments[0]?.kind).toBe('review');
    expect(parsed?.segments[1]?.kind).toBe('voices');
    expect(parsed?.segments[2]?.kind).toBe('consensus');
    expect(parsed?.segments[3]?.kind).toBe('decision');
  });
});

describe('web presentation helpers', () => {
  it('should expose three immediate theme options', () => {
    expect(THEME_OPTIONS.map((item) => item.value)).toEqual(['classic', 'ink', 'midnight']);
  });

  it('should build unified timeline items for completed turns', () => {
    const items = buildTimelineItems(createGame(), 'classic');

    expect(items).toHaveLength(2);
    expect(items[0].kind).toBe('turn');
    expect(items[0].title).toBe('第 2 回合');
    expect(items[0].summary).toContain('AI');
    expect(items[0].meta.tag).toBe('压力升级');
    expect(items[0].segments.map((segment) => segment.kind)).toEqual(['review', 'voices', 'consensus', 'decision']);
    expect(items[0].segments[0].text).toContain('红方刚抢到一点空间');
    expect(items[0].segments[3].text).toMatch(/(中路压力|红方先解压)/);
    expect(items[0].segments[3].text).toContain('将军');
  });

  it('should place illegal move and undo events into the same timeline stream', () => {
    const game = createGame();
    const illegal = buildErrorEvent(game, 'midnight', { code: 'ILLEGAL_MOVE', message: '非法', detail: '马腿被卡住。' }, 'b3 → b8', 5);
    const undo = buildUndoEvent(game, 'midnight', 2, 6);
    const items = buildTimelineItems(game, 'midnight', [illegal, undo]);

    expect(items[0].kind).toBe('event');
    expect(items[0].meta.eventType).toBe('undo');
    expect(items[1].meta.eventType).toBe('illegal_move');
    expect(items[1].segments[0].text).toContain('马腿被卡住');
    expect(items[1].segments[0].text).not.toContain('对应的事件事实已经明确');
    expect(items[1].segments[1].text).not.toContain('当前主线仍是');
    expect(items[1].segments[2].text).toContain('不计回合');
    expect(items[0].segments[2].text).toContain('重新接上');
    expect(items.some((item) => item.kind === 'turn')).toBe(true);
  });

  it('should build check and finish events with consistent envelope semantics', () => {
    const check = buildCheckEvent(createGame({ isCheck: true }), 'classic', 7);
    const resign = buildFinishEvent(createGame({ status: 'RESIGNED', endedByResign: true, resultWinner: 'black' }), 'classic', 8);
    const checkmated = buildFinishEvent(createGame({ status: 'CHECKMATED', resultWinner: 'red', endedAt: new Date().toISOString() }), 'classic', 9);

    const items = buildTimelineItems(createGame(), 'classic', [check, resign, checkmated]);

    expect(items[0].meta.eventType).toBe('finish');
    expect(items[0].meta.tag).toBe('胜负已定');
    expect(items[1].meta.eventType).toBe('resign');
    expect(items[1].meta.tag).toBe('主动收局');
    expect(items[2].meta.eventType).toBe('check');
    expect(items[2].segments[0].text).toContain('正面施压');
  });

  it('should fallback to minimal timeline payload when generator returns invalid schema', () => {
    const envelope: NarrativeRequestEnvelope = {
      schemaVersion: 'v1',
      requestId: 'turn-1',
      gameContext: {
        gameId: 'game-1',
        turnNumber: 1,
        userSide: 'red',
        aiSide: 'black',
        difficulty: 'NORMAL',
        gameStatus: 'ONGOING',
        isCheck: false,
        isGameEnding: false,
        storyThreadSummary: createGame().storyThreadSummary,
      },
      themeContext: {
        storyThemeId: 'border-council-night',
        storyThemeName: '边关夜议',
        themeTone: '稳中见锋',
        doNotUseStyles: [],
      },
      roleContext: {
        activeRoles: ['车', '马', '炮'],
        roleCardsVersion: 'v1',
        roleHints: [],
      },
      itemType: 'turn',
      itemPayload: {
        turnNumber: 1,
        userMove: { from: 'b3', to: 'b4', pieceType: '兵', semanticTag: '试探' },
        aiMove: { from: 'h8', to: 'h7', pieceType: '卒', semanticTag: '压迫' },
        capture: false,
        checkState: { before: false, after: false },
        situationShift: '局面仍在试探。',
        turnArc: '试探铺垫',
        storyThreadSummary: createGame().storyThreadSummary,
        narrativeGoal: '测试 fallback',
      },
      constraints: {
        maxChars: 180,
        segmentCount: 4,
        language: 'zh-CN',
        mustStayGroundedInFacts: true,
        allowWorldExpansion: false,
        mustReturnJson: true,
      },
      fallbackPolicy: {
        fallbackMode: 'template-minimal',
        timeoutMs: 1000,
        onSchemaInvalid: 'fallback',
        onEmptyResponse: 'fallback',
      },
    };

    const invalidGenerator = vi.fn(() => ({ title: '坏数据' } as unknown as NarrativeResponseEnvelope));
    const item = resolveTimelineItem('turn-1', 2, envelope, 'classic', { generator: invalidGenerator });

    expect(invalidGenerator).toHaveBeenCalledOnce();
    expect(item.meta.fallbackUsed).toBe(true);
    expect(item.segments).toHaveLength(4);
    expect(item.summary).toContain('你方');
  });
});
