import type { ApiErrorShape, GameMoveRecord, GameSummary, ThemeKey } from '@xiangqi-web/shared';

export const THEME_OPTIONS: Array<{ value: ThemeKey; label: string; hint: string }> = [
  { value: 'classic', label: '棋阁', hint: '木色棋席，稳住全局。' },
  { value: 'ink', label: '墨影', hint: '更克制，更像评书。' },
  { value: 'midnight', label: '夜局', hint: '更冷峻，像深夜复盘。' },
];

const ROLE_POOL = ['车', '马', '炮', '兵', '仕', '相', '帅'] as const;

const THEME_COPY: Record<ThemeKey, {
  intro: string[];
  verdict: string[];
  close: string[];
  roleVoices: string[];
  finish: string[];
}> = {
  classic: {
    intro: ['这一手先声夺人', '局面被轻轻拨动', '棋势忽然紧了半寸', '对方这步落得很实'],
    verdict: ['众子收口，先稳再取势。', '台面意见一致：先守住节拍，再找反打。', '合议结果很清楚：先把阵脚站稳。'],
    close: ['落点要兼顾先手与厚势。', '这一应手重在把局面压回正轨。', '先把主导权拿稳，再谈下一拍。'],
    roleVoices: ['先别急，边线还有转圜。', '这口气要顺着局面走。', '先补要点，再谈追击。', '这一步不是炫技，是稳场。'],
    finish: ['胜负已定，收官不再拖泥带水。', '这一局的气口，到这里算是落下了。'],
  },
  ink: {
    intro: ['对方一子落下，纸上风声微变', '这一手像是先写了半句诗', '局面被轻轻晕开一层墨色', '这一着落得含而不露'],
    verdict: ['众意既定，先以分寸应之。', '几位角色很快收住话头，只留一个落点。', '商议不多，收笔却很准。'],
    close: ['这一应手，不抢声量，只改气韵。', '回手处留白不多，刚够转势。', '先把句读摆正，再续后文。'],
    roleVoices: ['且慢，先看这一线的呼吸。', '不必喧哗，落点自己会说话。', '这步若轻，后文便散。', '先压住墨痕，再动锋芒。'],
    finish: ['终局既成，余墨到此为止。', '这一局写到这里，已经可以收卷。'],
  },
  midnight: {
    intro: ['雷达上这一手很扎眼', '棋盘温度降了一格', '对方这步像是在试探边界', '局势信号开始偏转'],
    verdict: ['频道统一，立即切回主动线。', '内部意见很快对齐：不跟着乱，直接控场。', '讨论结束，执行优先。'],
    close: ['这步更像校准，而不是冒进。', '先把风险压平，再顺势推进。', '这一应手的重点，是把节奏抢回来。'],
    roleVoices: ['别追光，先盯主线。', '这格子一丢，后面会很吵。', '先压风险，再谈漂亮。', '现在需要的是冷处理。'],
    finish: ['终局锁定，系统转入静默收尾。', '这一盘到此封灯，结果已经足够清楚。'],
  },
};

const SEGMENT_META = {
  review: { label: '简评', pendingText: '先把这一手的落点看清楚…' },
  voices: { label: '发言', pendingText: '角色们正在接力发言…' },
  consensus: { label: '共识', pendingText: '众将还在收口，不急着拍板…' },
  decision: { label: '落子', pendingText: '最终落点尚在酝酿…' },
} as const;

export type ApiErrorInfo = {
  code?: string;
  message: string;
  detail?: string;
};

export type EventTone = 'info' | 'success' | 'warning' | 'danger';

export type EventCard = {
  id: string;
  type: 'illegal' | 'undo' | 'resign' | 'check' | 'finish' | 'system';
  title: string;
  body: string;
  tone: EventTone;
  meta?: string;
};

export type NarrativeSegmentKind = keyof typeof SEGMENT_META;

export type NarrativeSegment = {
  id: string;
  text: string;
  kind: NarrativeSegmentKind;
  label: string;
  pendingText: string;
};

export type NarrativeTurn = {
  id: string;
  turnNumber: number;
  title: string;
  summary: string;
  segments: NarrativeSegment[];
};

export function normalizeApiError(error: unknown): ApiErrorInfo {
  if (!error || typeof error !== 'object') {
    return { message: '请求失败' };
  }

  const candidate = error as { error?: ApiErrorShape; message?: string };
  return {
    code: candidate.error?.code,
    message: candidate.error?.message ?? candidate.message ?? '请求失败',
    detail: candidate.error?.detail,
  };
}

function pickByTurn(values: string[], turnNumber: number, offset = 0) {
  return values[(turnNumber + offset) % values.length] ?? values[0] ?? '';
}

function getRoundRoles(turnNumber: number) {
  return Array.from({ length: 3 }, (_, index) => ROLE_POOL[(turnNumber + index) % ROLE_POOL.length]);
}

function buildSegment(id: string, kind: NarrativeSegmentKind, text: string): NarrativeSegment {
  return {
    id,
    kind,
    text,
    label: SEGMENT_META[kind].label,
    pendingText: SEGMENT_META[kind].pendingText,
  };
}

export function buildNarrativeTurns(game: GameSummary | null, theme: ThemeKey): NarrativeTurn[] {
  if (!game?.moves.length) {
    return [];
  }

  const meta = THEME_COPY[theme];
  const grouped = new Map<number, GameMoveRecord[]>();
  for (const move of game.moves) {
    const existing = grouped.get(move.turnNumber) ?? [];
    existing.push(move);
    grouped.set(move.turnNumber, existing);
  }

  const latestTurnNumber = Math.max(...grouped.keys());

  return [...grouped.entries()]
    .sort(([left], [right]) => left - right)
    .map(([turnNumber, moves]) => {
      const userMove = moves.find((move) => move.actor === 'USER');
      const aiMove = moves.find((move) => move.actor === 'AI');
      const roles = getRoundRoles(turnNumber);
      const userMoveText = userMove ? `${userMove.from} → ${userMove.to}` : '本回合由 AI 先处理残局';
      const aiMoveText = aiMove ? `${aiMove.from} → ${aiMove.to}` : '本回合后对局已结束';
      const checkSuffix = turnNumber === latestTurnNumber && game.isCheck && game.status === 'ONGOING'
        ? '局面已成将军，气压明显更紧。'
        : '';

      return {
        id: `turn-${turnNumber}`,
        turnNumber,
        title: `第 ${turnNumber} 回合`,
        summary: aiMove
          ? `你走 ${userMoveText}，AI 应对 ${aiMoveText}${checkSuffix ? ` · ${checkSuffix}` : ''}`
          : `你走 ${userMoveText}，随后局面直接收口。`,
        segments: [
          buildSegment(
            `turn-${turnNumber}-review`,
            'review',
            `${pickByTurn(meta.intro, turnNumber)}：你先落 ${userMoveText}${checkSuffix ? `，${checkSuffix}` : '。'}`,
          ),
          buildSegment(
            `turn-${turnNumber}-voices`,
            'voices',
            roles.map((role, index) => `${role}：${pickByTurn(meta.roleVoices, turnNumber, index)}`).join(' '),
          ),
          buildSegment(`turn-${turnNumber}-consensus`, 'consensus', pickByTurn(meta.verdict, turnNumber)),
          buildSegment(
            `turn-${turnNumber}-decision`,
            'decision',
            aiMove
              ? `最终落子 ${aiMoveText}。${pickByTurn(meta.close, turnNumber)}`
              : pickByTurn(meta.finish, turnNumber),
          ),
        ],
      };
    });
}

export function buildErrorEvent(error: ApiErrorInfo, attemptedMove?: string): EventCard {
  if (error.code === 'ILLEGAL_MOVE') {
    return {
      id: `illegal-${Date.now()}`,
      type: 'illegal',
      title: '非法落子',
      body: attemptedMove
        ? `${attemptedMove} 没有通过规则校验。${error.detail ?? '棋盘保持原状，你可以直接换一步。'}`
        : error.detail ?? '这一步不合棋规，棋盘保持原状。',
      tone: 'warning',
      meta: '不计回合 / 可立即重走',
    };
  }

  return {
    id: `system-${Date.now()}`,
    type: 'system',
    title: '操作未完成',
    body: error.detail ?? error.message,
    tone: 'danger',
    meta: error.code,
  };
}

export function buildUndoEvent(revertedTurnNumber: number): EventCard {
  return {
    id: `undo-${Date.now()}`,
    type: 'undo',
    title: '悔棋事件',
    body: `最近一个完整回合已撤回，当前回到第 ${revertedTurnNumber} 回合之前的局面。`,
    tone: 'info',
    meta: '撤销最近完整回合',
  };
}

export function buildCheckEvent(game: GameSummary): EventCard {
  return {
    id: `check-${game.id}-${game.moves.length}`,
    type: 'check',
    title: '将军提醒',
    body: 'AI 的应手已经把帅门压紧，下一手需要优先解将。',
    tone: 'warning',
    meta: `第 ${Math.ceil(game.moves.length / 2)} 回合`,
  };
}

export function buildFinishEvent(game: GameSummary): EventCard {
  const winnerText = game.resultWinner
    ? game.resultWinner === game.userSide ? '你方' : 'AI'
    : '双方';

  if (game.status === 'RESIGNED') {
    return {
      id: `finish-${game.id}-${game.moves.length}`,
      type: 'resign',
      title: '认输事件',
      body: '本局已按认输结束，AI 收下胜势，讨论区也随之收束。',
      tone: 'danger',
      meta: '终局反馈',
    };
  }

  if (game.status === 'CHECKMATED') {
    return {
      id: `finish-${game.id}-${game.moves.length}`,
      type: 'finish',
      title: '终局反馈',
      body: `${winnerText === '双方' ? '棋局已经终结。' : `${winnerText}拿下将死。`} 本局演绎到此收官。`,
      tone: game.resultWinner === game.userSide ? 'success' : 'warning',
      meta: '将死',
    };
  }

  if (game.status === 'STALEMATE' || game.status === 'DRAW') {
    return {
      id: `finish-${game.id}-${game.moves.length}`,
      type: 'finish',
      title: '终局反馈',
      body: '局面已无法继续扩张，本局以和局收束。',
      tone: 'info',
      meta: game.status === 'DRAW' ? '和棋' : '无子可走',
    };
  }

  return {
    id: `finish-${game.id}-${game.moves.length}`,
    type: 'finish',
    title: '终局反馈',
    body: `${winnerText === '双方' ? '本局以和局收束。' : `${winnerText}拿下本局。`}`,
    tone: game.resultWinner === game.userSide ? 'success' : 'warning',
    meta: game.status,
  };
}
