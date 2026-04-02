import {
  DEFAULT_STORY_THREAD_SUMMARY,
  type ApiErrorShape,
  type FinishReason,
  type GameMoveRecord,
  type GameSummary,
  type MoveTag,
  type NarrativeEventPayload,
  type NarrativeHighlightLevel,
  type NarrativeRequestEnvelope,
  type NarrativeResponseEnvelope,
  type NarrativeResponseSegment,
  type NarrativeSegmentKind,
  type NarrativeTone,
  type SpecialEventType,
  type ThemeKey,
  type TurnArc,
} from '@xiangqi-web/shared';

export const THEME_OPTIONS: Array<{ value: ThemeKey; label: string; hint: string }> = [
  { value: 'classic', label: '棋阁', hint: '木色棋席，稳住全局。' },
  { value: 'ink', label: '墨影', hint: '更克制，更像评书。' },
  { value: 'midnight', label: '夜局', hint: '更冷峻，像深夜复盘。' },
];

const ROLE_POOL = ['车', '马', '炮', '兵', '仕', '相', '帅'] as const;

const THEME_COPY: Record<ThemeKey, {
  storyThemeId: string;
  storyThemeName: string;
  themeTone: string;
  doNotUseStyles: string[];
  intro: string[];
  roleVoices: string[];
  consensus: string[];
  close: string[];
  eventLead: Record<SpecialEventType, string>;
}> = {
  classic: {
    storyThemeId: 'border-council-night',
    storyThemeName: '边关夜议',
    themeTone: '稳中见锋',
    doNotUseStyles: ['长篇抒情', '过度比喻', '强表演台词'],
    intro: ['案上棋局轻响，先手把话头挑明了。', '这一手先落下，军议的气口立刻往前推了半寸。', '木案一震，局面开始真正进入互相试探。'],
    roleVoices: ['先把这条线看稳。', '别急着炫手，先收住要点。', '这步要顺着局势，不要逆着走。', '先把厚势站住，再谈追击。'],
    consensus: ['众子很快收口：', '几句议论之后，台面结论被压成一句：', '这一回合的拍板意见很明确：'],
    close: ['这一应手的重点，是把主动权捏回手里。', '落点并不花哨，但它把节拍重新卡稳了。', '这一拍先定准，再看下一手如何扩张。'],
    eventLead: {
      illegal_move: '军议否决',
      undo: '推演回拨',
      resign: '主动收局',
      check: '正面施压',
      finish: '胜负已定',
    },
  },
  ink: {
    storyThemeId: 'border-council-ink',
    storyThemeName: '边关夜议',
    themeTone: '克制留白',
    doNotUseStyles: ['热闹群像', '夸张口号', '密集修辞'],
    intro: ['墨色才晕开一点，这步就先写下了句读。', '这一着像是先按住了纸角，随后才让风声起。', '局面轻轻一转，桌上的留白立刻少了一块。'],
    roleVoices: ['且看这一线的呼吸。', '不必喧哗，落点自己会说话。', '先把句子写稳，再谈锋芒。', '这步若轻，后文就散了。'],
    consensus: ['几位角色把话头收短，只留下结论：', '众意不多作铺陈，最后只写成一句：', '这一回合的收笔方式很统一：'],
    close: ['这一应手不抢声量，只改了局面的气韵。', '它不像猛击，更像把句读重新摆正。', '真正被改写的，不是字面，而是后手的呼吸。'],
    eventLead: {
      illegal_move: '军议否决',
      undo: '推演回拨',
      resign: '主动收局',
      check: '正面施压',
      finish: '胜负已定',
    },
  },
  midnight: {
    storyThemeId: 'border-council-radar',
    storyThemeName: '边关夜议',
    themeTone: '冷静压迫',
    doNotUseStyles: ['温吞总结', '松散抒情', '过长铺垫'],
    intro: ['监测线上这一手很快亮起，局势开始偏转。', '棋盘温度降了一格，双方的容错也跟着收紧。', '这一拍落下后，局面像是被切进更窄的通道。'],
    roleVoices: ['别追光，先盯主线。', '先压风险，再谈漂亮。', '这格子一丢，后面会很吵。', '先把主动线校准。'],
    consensus: ['频道迅速对齐，最后的口径是：', '短暂讨论后，内部统一成一句：', '这一回合的执行结论已经很清楚：'],
    close: ['这一步更像校准，而不是冒进。', '它先把风险压平，再把压迫线往前推。', '真正被拿回来的，是下一拍的话语权。'],
    eventLead: {
      illegal_move: '军议否决',
      undo: '推演回拨',
      resign: '主动收局',
      check: '正面施压',
      finish: '胜负已定',
    },
  },
};

const SEGMENT_META: Record<NarrativeSegmentKind, { label: string; pendingText: string }> = {
  review: { label: '简评', pendingText: '先把这一手的落点看清楚…' },
  voices: { label: '发言', pendingText: '角色们正在接力发言…' },
  consensus: { label: '共识', pendingText: '众将还在收口，不急着拍板…' },
  decision: { label: '落子', pendingText: '最终落点尚在酝酿…' },
  event: { label: '事件', pendingText: '事件事实正在归拢…' },
  impact: { label: '影响', pendingText: '棋盘影响尚在整理…' },
  closure: { label: '结论', pendingText: '结论还在最后校准…' },
};

export type ApiErrorInfo = {
  code?: string;
  message: string;
  detail?: string;
};

export type RuntimeTimelineEvent = {
  id: string;
  order: number;
  envelope: NarrativeRequestEnvelope;
};

export type TimelineSegment = {
  id: string;
  kind: NarrativeSegmentKind;
  label: string;
  text: string;
  pendingText: string;
};

export type TimelineItem = {
  id: string;
  kind: 'turn' | 'event';
  order: number;
  title: string;
  summary: string;
  tone: 'info' | 'success' | 'warning' | 'danger';
  highlightLevel: NarrativeHighlightLevel;
  segments: TimelineSegment[];
  meta: {
    turnNumber?: number;
    eventType?: SpecialEventType;
    tag?: string;
    fallbackUsed?: boolean;
  };
};

type NarrativeGenerator = (envelope: NarrativeRequestEnvelope, theme: ThemeKey) => NarrativeResponseEnvelope;

type ComposeOptions = {
  generator?: NarrativeGenerator;
};

type TurnPayload = Extract<NarrativeRequestEnvelope['itemPayload'], { turnNumber: number }>;

function makeSegment(id: string, segment: NarrativeResponseSegment): TimelineSegment {
  return {
    id,
    kind: segment.kind,
    label: SEGMENT_META[segment.kind].label,
    text: segment.text,
    pendingText: SEGMENT_META[segment.kind].pendingText,
  };
}

function logNarrativeFailure(payload: { failureReason: string; turnType: 'turn' | 'event'; eventType: SpecialEventType | 'none' }) {
  console.warn('[bundle-c-narrative-fallback]', payload);
}

function mapTone(tone: NarrativeTone): TimelineItem['tone'] {
  switch (tone) {
    case 'warning':
      return 'warning';
    case 'decisive':
      return 'success';
    case 'tense':
      return 'danger';
    case 'elegiac':
      return 'info';
    case 'calm':
    default:
      return 'info';
  }
}

function clip(text: string, max: number) {
  return text.length > max ? `${text.slice(0, max - 1)}…` : text;
}

function getRoundRoles(turnNumber: number, count: number) {
  return Array.from({ length: count }, (_, index) => ROLE_POOL[(turnNumber + index) % ROLE_POOL.length]);
}

function buildThemeContext(theme: ThemeKey) {
  const copy = THEME_COPY[theme];
  return {
    storyThemeId: copy.storyThemeId,
    storyThemeName: copy.storyThemeName,
    themeTone: copy.themeTone,
    doNotUseStyles: copy.doNotUseStyles,
  } as const;
}

function buildRoleContext(turnNumber: number, highlightLevel: NarrativeHighlightLevel) {
  const activeRoles = getRoundRoles(turnNumber, highlightLevel === 'high' ? 4 : 3);
  return {
    activeRoles,
    roleCardsVersion: 'v1' as const,
    roleHints: activeRoles.map((role) => `${role}：发言要短，要贴住当前局势。`),
  };
}

function isNarrativeResponseEnvelope(value: unknown, itemType: 'turn' | 'event'): value is NarrativeResponseEnvelope {
  if (!value || typeof value !== 'object') {
    return false;
  }

  const candidate = value as Partial<NarrativeResponseEnvelope>;
  return candidate.schemaVersion === 'v1'
    && candidate.itemType === itemType
    && typeof candidate.title === 'string'
    && typeof candidate.summary === 'string'
    && Array.isArray(candidate.segments)
    && candidate.segments.length > 0
    && candidate.segments.every((segment) => typeof segment?.text === 'string' && typeof segment?.label === 'string' && typeof segment?.kind === 'string');
}

function createRequestId(prefix: string, order: number) {
  return `${prefix}-${order}`;
}

function fallbackTurnTag(moveTag: MoveTag | undefined, fallback: MoveTag) {
  return moveTag ?? fallback;
}

function fallbackTurnArc(turnArc: TurnArc | undefined) {
  return turnArc ?? '试探铺垫';
}

function buildTurnEnvelope(game: GameSummary, turnNumber: number, moves: GameMoveRecord[], theme: ThemeKey): NarrativeRequestEnvelope {
  const userMove = moves.find((move) => move.actor === 'USER');
  const aiMove = moves.find((move) => move.actor === 'AI') ?? null;
  const decision = aiMove?.decision ?? null;
  const highlightLevel: NarrativeHighlightLevel = aiMove?.decision?.highlightReason?.length
    ? (aiMove.decision.highlightReason.length > 1 ? 'high' : 'medium')
    : (game.isCheck && game.status === 'ONGOING' ? 'medium' : 'low');
  const storyThreadSummary = decision?.storyThreadSummary ?? game.storyThreadSummary ?? DEFAULT_STORY_THREAD_SUMMARY;

  return {
    schemaVersion: 'v1',
    requestId: createRequestId(`turn-${turnNumber}`, turnNumber),
    gameContext: {
      gameId: game.id,
      turnNumber,
      userSide: game.userSide,
      aiSide: game.aiSide,
      difficulty: game.difficulty,
      gameStatus: game.status,
      isCheck: game.isCheck,
      isGameEnding: game.status !== 'ONGOING',
      storyThreadSummary,
    },
    themeContext: buildThemeContext(theme),
    roleContext: buildRoleContext(turnNumber, highlightLevel),
    itemType: 'turn',
    itemPayload: {
      turnNumber,
      userMove: {
        ...(userMove ?? { from: '--', to: '--' }),
        pieceType: userMove?.pieceType,
        semanticTag: fallbackTurnTag(decision?.userMoveTag, '试探'),
      },
      aiMove: aiMove
        ? {
          ...aiMove,
          pieceType: aiMove.pieceType,
          semanticTag: fallbackTurnTag(decision?.aiMoveTag, game.status === 'ONGOING' ? '试探' : '收束'),
        }
        : null,
      capture: Boolean(userMove?.captured || aiMove?.captured),
      checkState: {
        before: false,
        after: turnNumber === Math.ceil(game.moves.length / 2) && game.isCheck && game.status === 'ONGOING',
      },
      situationShift: decision?.situationShift ?? '这一回合已进入统一时间线，但结构化解释缺失，只保留最小事实推进。',
      turnArc: fallbackTurnArc(decision?.turnArc),
      highlightReason: decision?.highlightReason,
      storyThreadSummary,
      narrativeGoal: '解释这一回合在剧情上的推进意义，并保持角色发言克制短促。',
    },
    constraints: {
      maxChars: highlightLevel === 'high' ? 220 : 180,
      segmentCount: 4,
      language: 'zh-CN',
      mustStayGroundedInFacts: true,
      allowWorldExpansion: false,
      mustReturnJson: true,
    },
    fallbackPolicy: {
      fallbackMode: 'template-minimal',
      timeoutMs: highlightLevel === 'high' ? 1800 : 1100,
      onSchemaInvalid: 'fallback',
      onEmptyResponse: 'fallback',
    },
  };
}

function buildTurnSummaryLine(turnNumber: number, payload: TurnPayload) {
  const userText = `${payload.userMove.pieceType ?? '子'} ${payload.userMove.from}→${payload.userMove.to}`;
  if (!payload.aiMove) {
    return `第 ${turnNumber} 回合只落到你方 ${userText}，随后局面直接收口。`;
  }

  return `第 ${turnNumber} 回合：你方 ${userText} 先动，AI 以 ${payload.aiMove.pieceType ?? '子'} ${payload.aiMove.from}→${payload.aiMove.to} 回应。`;
}

function pick<T>(values: T[], seed: number, offset = 0) {
  return values[(seed + offset) % values.length] ?? values[0];
}

const TURN_ARC_REVIEW_COPY: Record<TurnArc, string[]> = {
  '试探铺垫': [
    '这一拍更像先摸水温，没有谁急着把局面一次写死。',
    '双方还在试哪条线会先松动，重点是把下一拍的入口摸出来。',
    '眼下仍属铺垫段，真正的发力点还没彻底翻到台面上。',
  ],
  '抢势加码': [
    '这一回合不是换主题，而是在原有主线上继续抢半拍先手。',
    '局面没有突然翻面，但节拍明显被继续往前推了一点。',
    '看起来只是续了一手，实质上是在原来的争点上继续加码。',
  ],
  '压力升级': [
    '这一来一回把压迫感又抬了一层，容错已经没前几拍那么宽。',
    '局面开始往更窄的通道里收，后手选择一下子少了。',
    '从这一拍开始，双方不再只是试探，压力已经真正落到盘面上。',
  ],
  '攻守换边': [
    '这一手的关键不在热闹，而在话语权开始换手。',
    '原本被动的一侧，正在把问题重新丢回给对面。',
    '攻守重心在这一拍里悄悄换边，后文的站位也随之改写。',
  ],
  '稳阵解围': [
    '这一回合的价值不在抢戏，而在先把最难受的点拆掉。',
    '比起扩张，这一步更像先把局面从失衡边缘拽回来。',
    '先把阵脚扶正，是这一拍比花样更重要的事。',
  ],
  '收束临门': [
    '局面已经不是单纯铺垫，而是在往收口线贴过去。',
    '从这一拍开始，很多变化都不再是发散，而是逼近结论。',
    '这一步之后，棋盘上能绕开的空间已经不多了。',
  ],
};

const MOVE_TAG_DECISION_COPY: Record<MoveTag, string[]> = {
  '试探': ['先把边界摸清', '试着探明下一拍入口', '先看对面的真实反应'],
  '抢位': ['把站位先占下来', '先把关键格拿到手里', '不让位置白白松掉'],
  '压迫': ['把压力继续往前顶', '把对面的喘息空间压窄', '把主线强行拽进自己的节拍'],
  '解围': ['先把受压点拆开', '把最急的风险压回去', '先卸掉眼前这口重压'],
  '护驾': ['先把核心点护稳', '优先保住中枢不失位', '先守住不能丢的那一格'],
  '换子': ['主动换掉盘面负担', '把重量重新结算一遍', '先把交换做成对自己更顺手'],
  '佯动': ['先放一个假动作试水', '把注意力从真正争点上引开', '先借虚招撬开下一拍空间'],
  '追击': ['顺势把追击线接上', '不给对面轻易把节拍缓回来', '沿着已有优势继续追着打'],
  '收束': ['把局面往结论上推', '不再留太多岔路', '把后文尽量压短'],
};

function describePressureSide(story: TurnPayload['storyThreadSummary']) {
  switch (story.pressureSide) {
    case 'BLACK':
      return '黑方当前更占话语权';
    case 'RED':
      return '红方当前更占话语权';
    case 'BALANCED':
    default:
      return '双方暂时都还没能彻底压过对方';
  }
}

function buildTurnSeed(payload: TurnPayload) {
  const source = [
    payload.turnNumber,
    payload.turnArc,
    payload.userMove.semanticTag,
    payload.aiMove?.semanticTag ?? 'none',
    payload.storyThreadSummary.currentPhase,
    payload.storyThreadSummary.pressureSide,
    payload.storyThreadSummary.recentFocus,
    payload.highlightReason?.join('|') ?? 'none',
    payload.capture ? 'capture' : 'quiet',
    payload.checkState.after ? 'check' : 'normal',
  ].join(':');

  return Array.from(source).reduce((sum, char, index) => sum + char.charCodeAt(0) * (index + 1), 0);
}

function buildTurnReviewText(
  copy: (typeof THEME_COPY)[ThemeKey],
  payload: TurnPayload,
  turnNumber: number,
  userText: string,
  aiText: string,
) {
  const seed = buildTurnSeed(payload);
  const reviewLead = pick(copy.intro, seed);
  const arcReview = pick(TURN_ARC_REVIEW_COPY[payload.turnArc], seed, 1);
  const exchangeNote = payload.capture
    ? pick([
      '这一来一回还带出了交换，盘面重量被重新拨了一次。',
      '中间那下交换把盘面重心也轻轻挪了一格。',
      '子力一经交换，这回合的轻重立刻变得更分明。',
    ], seed)
    : '';
  const checkNote = payload.checkState.after
    ? pick([
      '这一应手之后，将军压力被直接摆上了桌面。',
      '回手一落，将军这件事就没法再往后拖了。',
      '这步之后最刺眼的，不再是布局，而是眼前这口将。',
    ], seed, 1)
    : '';
  const exchangeLine = pick([
    `${userText} 先把话头挑开，${aiText} 随即把回应压到盘上。`,
    `这一回合先由 ${userText} 把题目抛出来，AI 再用 ${aiText} 接住节拍。`,
    `${userText} 先落成 ${payload.userMove.semanticTag}，对面再拿 ${aiText} 回成 ${payload.aiMove?.semanticTag ?? '收束'}。`,
    `${userText} 抢先把局面拨动了一下，随后 ${aiText} 把回手补上。`,
  ], seed, 2);

  return `${reviewLead} ${exchangeLine} ${arcReview} ${payload.situationShift} ${exchangeNote} ${checkNote}`.replace(/\s+/g, ' ').trim();
}

function buildTurnConsensusText(copy: (typeof THEME_COPY)[ThemeKey], payload: TurnPayload, turnNumber: number) {
  const story = payload.storyThreadSummary;
  const pressureLine = describePressureSide(story);
  const seed = buildTurnSeed(payload);
  const phaseLine = pick([
    `${story.mainConflict}`,
    `${pressureLine}，但这盘棋还没从 ${story.currentPhase} 里走出去。`,
    `局面到这里仍留在 ${story.currentPhase} 的写法里，焦点还是 ${story.recentFocus}。`,
    `盘面没有突然换题，双方还在围着 ${story.recentFocus} 拉扯。`,
    `这盘棋到这里还不算改题，真正缠斗的仍是 ${story.recentFocus}。`,
    `双方都没把 ${story.recentFocus} 真正抢成自己的稳定地盘。`,
  ], seed);
  const followLine = pick([
    `接下来先别跳题，还是看 ${story.recentFocus} 会往哪边落。`,
    `${story.recentFocus} 还没从台面中央退下去。`,
    `后面的判断暂时都还得从 ${story.recentFocus} 这条线上继续拆。`,
    `真正该盯的，还是 ${story.recentFocus} 这一点会不会先松。`,
    `谁先把这里走成实利，才会决定下一拍的口风。`,
    `真正的分水岭，暂时还没有离开 ${story.recentFocus}。`,
  ], seed, 2);

  return `${pick(copy.consensus, seed)}${phaseLine} ${followLine}`.replace(/\s+/g, ' ').trim();
}

function buildTurnDecisionText(
  copy: (typeof THEME_COPY)[ThemeKey],
  payload: TurnPayload,
  turnNumber: number,
  aiText: string,
) {
  const aiTag = payload.aiMove?.semanticTag ?? '收束';
  const story = payload.storyThreadSummary;
  const seed = buildTurnSeed(payload);
  const tagGoal = pick(MOVE_TAG_DECISION_COPY[aiTag], seed);
  const carryLine = pick([
    `这手之后，后文多半还得回到 ${story.recentFocus} 上见真章。`,
    `真正留给下一拍的问题，是谁能先把 ${story.recentFocus} 走实。`,
    `它没有把话说满，只是先把后手重心压回 ${story.recentFocus}。`,
    `如果顺着这条线往后看，下一拍大致还是：${story.carryForward}`,
    `这步没有把故事说完，只是把悬念继续留在 ${story.recentFocus} 上。`,
    `再往下看，胜负手多半还是绕不开 ${story.recentFocus}。`,
  ], seed, 1);
  const highlightLine = payload.highlightReason?.length
    ? pick([
      `盘面真正发亮的地方，在于 ${payload.highlightReason.join('、')}。`,
      `${payload.highlightReason.join('、')} 才是这回合最该被记住的一笔。`,
      `若回头只摘一个钉子，这一拍多半会落在 ${payload.highlightReason.join('、')} 上。`,
      `整回合最冒头的信号，还是 ${payload.highlightReason.join('、')}。`,
    ], seed, 2)
    : '';

  return `${pick([
    `最后这一着落成 ${aiText}，意思很明白：${tagGoal}。`,
    `AI 把应手停在 ${aiText}，摆明是想 ${tagGoal}。`,
    `应手最终压到 ${aiText}，这手的心思就在于 ${tagGoal}。`,
    `${aiText} 被落成这一手，核心其实就一句：${tagGoal}。`,
    `${aiText} 之所以落在这里，说到底还是为了 ${tagGoal}。`,
    `这一应手不靠花哨，真正要做的无非是 ${tagGoal}。`,
  ], seed)} ${carryLine} ${highlightLine} ${pick(copy.close, seed)}`.replace(/\s+/g, ' ').trim();
}

function composeTurnNarrative(envelope: NarrativeRequestEnvelope, theme: ThemeKey): NarrativeResponseEnvelope {
  const copy = THEME_COPY[theme];
  const payload = envelope.itemPayload as TurnPayload;
  const story = payload.storyThreadSummary;
  const roles = envelope.roleContext.activeRoles;
  const turnNumber = payload.turnNumber;
  const userText = `${payload.userMove.pieceType ?? '子'} ${payload.userMove.from}→${payload.userMove.to}`;
  const aiText = payload.aiMove ? `${payload.aiMove.pieceType ?? '子'} ${payload.aiMove.from}→${payload.aiMove.to}` : '残局直接收口';
  const highlightLevel: NarrativeHighlightLevel = payload.highlightReason?.length
    ? (payload.highlightReason.length > 1 ? 'high' : 'medium')
    : (payload.checkState.after ? 'medium' : 'low');
  const voices = roles.map((role, index) => `${role}：${pick(copy.roleVoices, turnNumber, index)}`).join(' ');

  return {
    schemaVersion: 'v1',
    itemType: 'turn',
    title: `第 ${turnNumber} 回合`,
    summary: clip(buildTurnSummaryLine(turnNumber, payload), 88),
    tone: payload.checkState.after || payload.turnArc === '收束临门' ? 'tense' : highlightLevel === 'high' ? 'decisive' : 'calm',
    highlightLevel,
    segments: [
      {
        kind: 'review',
        label: SEGMENT_META.review.label,
        text: buildTurnReviewText(copy, payload, turnNumber, userText, aiText),
      },
      {
        kind: 'voices',
        label: SEGMENT_META.voices.label,
        text: voices,
      },
      {
        kind: 'consensus',
        label: SEGMENT_META.consensus.label,
        text: buildTurnConsensusText(copy, payload, turnNumber),
      },
      {
        kind: 'decision',
        label: SEGMENT_META.decision.label,
        text: buildTurnDecisionText(copy, payload, turnNumber, aiText),
      },
    ],
    displayHints: {
      storyPhase: story.currentPhase,
      pressureSide: story.pressureSide,
    },
  };
}

function getEventTone(eventType: SpecialEventType, finishReason?: FinishReason): NarrativeTone {
  if (eventType === 'illegal_move') {
    return 'warning';
  }

  if (eventType === 'undo') {
    return 'elegiac';
  }

  if (eventType === 'check') {
    return 'tense';
  }

  if (eventType === 'resign' || finishReason === 'checkmate') {
    return 'decisive';
  }

  return 'calm';
}

function getEventHighlightLevel(eventType: SpecialEventType, finishReason?: FinishReason): NarrativeHighlightLevel {
  if (eventType === 'check' || eventType === 'resign' || finishReason === 'checkmate') {
    return 'high';
  }

  if (eventType === 'illegal_move' || eventType === 'undo') {
    return 'medium';
  }

  return 'low';
}

function getEventTitle(eventType: SpecialEventType) {
  switch (eventType) {
    case 'illegal_move':
      return '非法落子';
    case 'undo':
      return '悔棋事件';
    case 'resign':
      return '认输事件';
    case 'check':
      return '将军提醒';
    case 'finish':
    default:
      return '终局反馈';
  }
}

function describeEventMove(payload: NarrativeEventPayload) {
  if (!payload.relatedMove) {
    return payload.eventType === 'finish' ? '这局棋' : '这一拍';
  }

  return `${payload.relatedMove.pieceType ?? '子'} ${payload.relatedMove.from}→${payload.relatedMove.to}`;
}

function buildEventSummary(payload: NarrativeEventPayload, lead: string, turnNumber: number) {
  switch (payload.eventType) {
    case 'illegal_move':
      return clip(pick([
        `${lead}：${payload.eventReason}`,
        `${lead}，这步没能成立：${payload.eventReason}`,
        `${lead}，当前方案被当场打回：${payload.eventReason}`,
      ], turnNumber), 84);
    case 'undo':
      return clip(pick([
        `${lead}：最近一个完整回合已撤回。`,
        `${lead}：棋局已经退回上一个判断点。`,
        `${lead}：刚才那轮推演先收回重看。`,
      ], turnNumber, 1), 84);
    case 'check':
      return clip(pick([
        `${lead}：帅门压力已经压到眼前。`,
        `${lead}：这一拍必须先处理将军。`,
        `${lead}：局面已经进入必须应将的状态。`,
      ], turnNumber, 2), 84);
    case 'resign':
      return clip(pick([
        `${lead}：本局到这里主动收住。`,
        `${lead}：这一局不再往后拖了。`,
        `${lead}：对局到此结束，不再续手。`,
      ], turnNumber), 84);
    case 'finish':
    default:
      return clip(pick([
        `${lead}：本局已经收成定局。`,
        `${lead}：棋局到这里已经落槌。`,
        `${lead}：这一盘的结论已经写明。`,
      ], turnNumber, 1), 84);
  }
}

function buildEventFactText(payload: NarrativeEventPayload, lead: string, turnNumber: number) {
  const moveText = describeEventMove(payload);
  switch (payload.eventType) {
    case 'illegal_move':
      return pick([
        `${moveText} 这步没能过规则校验，原因很直接：${payload.eventReason}`,
        `${lead}拦下的是 ${moveText}，症结就在：${payload.eventReason}`,
        `${moveText} 走到这一步就被叫停了，问题出在：${payload.eventReason}`,
      ], turnNumber);
    case 'undo':
      return pick([
        `刚才那个完整回合先被抽回，棋盘重新停在上一个判断点。`,
        `这次不是续走，而是把最近一轮推演整段回拨。`,
        `上一轮来回先不算，局面已经退回撤回前的节点。`,
      ], turnNumber, 1);
    case 'check':
      return pick([
        `${lead}来得很直接：${moveText} 把压力直接送到了帅门前。`,
        `${lead}已经成形，这一应手没有留缓冲，${payload.eventReason}`,
        `${lead}不是虚声，局面被一下子压紧，${payload.eventReason}`,
      ], turnNumber, 2);
    case 'resign':
      return pick([
        `对局没有再往下拖，当前已经按主动收局处理。`,
        `这一局就在这里收住，不再继续往后演。`,
        `双方不再续手，当前结果已经按认输落定。`,
      ], turnNumber);
    case 'finish':
    default:
      return payload.finishReason === 'rule_settlement'
        ? pick([
          `这局棋没有继续扩写，系统已经把结果收定。`,
          `后续变化不再展开，当前由系统直接给出收束。`,
          `盘面到这里不再续拍，系统裁断已经落下。`,
        ], turnNumber, 1)
        : pick([
          `这一盘已经分出高下，后文没有再拖长的空间。`,
          `胜负线已经压实，局面不再保留回旋余地。`,
          `到这里结果已经明白，继续铺陈反而多余。`,
        ], turnNumber, 2);
  }
}

function buildEventImpactText(payload: NarrativeEventPayload, story: NarrativeEventPayload['storyThreadSummary'], turnNumber: number) {
  const storyLine = pick([
    `眼下盘面的关注点仍卡在 ${story.recentFocus}。`,
    `这次变化没有把主线打散，焦点还在 ${story.recentFocus}。`,
    `盘面重心暂时没换轨，接下来仍得盯 ${story.recentFocus}。`,
  ], turnNumber);

  switch (payload.eventType) {
    case 'illegal_move':
      return `${payload.stateImpact} ${storyLine}`;
    case 'undo':
      return `${payload.stateImpact} 被撤回的不是一个字句，而是整轮判断。`;
    case 'check':
      return `${payload.stateImpact} 现在已经没有闲手空间。`;
    case 'resign':
      return `${payload.stateImpact} 讨论区也该跟着收短，不再扩展岔线。`;
    case 'finish':
    default:
      return `${payload.stateImpact} ${storyLine}`;
  }
}

function buildEventClosureText(payload: NarrativeEventPayload, story: NarrativeEventPayload['storyThreadSummary'], turnNumber: number) {
  switch (payload.eventType) {
    case 'illegal_move':
      return pick([
        `这手不计回合，直接换解法即可；下一拍还是优先处理 ${story.recentFocus}。`,
        `这一方案到此为止，改走就行，但别把 ${story.recentFocus} 放丢。`,
        `不用围着这次失败多讲，重新落子即可；真正要继续盯的还是 ${story.recentFocus}。`,
      ], turnNumber);
    case 'undo':
      return pick([
        `既然已经回拨，后面的演绎就该重新接上这句：${story.carryForward}`,
        `这一撤回的意义，就是把后文重新压回到：${story.carryForward}`,
        `接下来的写法不该沿用刚才那轮，而要从这里重新接上：${story.carryForward}`,
      ], turnNumber, 1);
    case 'check':
      return pick([
        `下一步先解压，再谈别的；否则 ${story.recentFocus} 会继续失守。`,
        `眼下没有比解将更靠前的事，撑过这一拍之后再说扩张。`,
        `先把这口将应掉，后续有没有反手空间，再回头判断。`,
      ], turnNumber, 2);
    case 'resign':
      return pick([
        '这一局就收在这里，讨论区不再额外加戏。',
        '既然已经主动收局，后文到此为止最干净。',
        '结果既已确认，时间线也该在这里自然停住。',
      ], turnNumber);
    case 'finish':
    default:
      return payload.finishReason === 'rule_settlement'
        ? pick([
          '这一段按系统裁断收住即可，不再往外添额外戏份。',
          '既然由规则收口，讨论区到这里停下最合适。',
          '这类终局不需要再抒情，按裁断结果收束就够了。',
        ], turnNumber, 1)
        : pick([
          '胜负已经摆明，讨论区到这里落槌刚好。',
          '结论既然成立，后文就不必再做拖长处理。',
          '这盘棋走到这里已经够了，再多写反而会冲淡收口。',
        ], turnNumber, 2);
  }
}

function composeEventNarrative(envelope: NarrativeRequestEnvelope, theme: ThemeKey): NarrativeResponseEnvelope {
  const copy = THEME_COPY[theme];
  const payload = envelope.itemPayload as NarrativeEventPayload;
  const story = payload.storyThreadSummary;
  const lead = copy.eventLead[payload.eventType];
  const turnNumber = payload.eventAtTurn;

  return {
    schemaVersion: 'v1',
    itemType: 'event',
    title: getEventTitle(payload.eventType),
    summary: buildEventSummary(payload, lead, turnNumber),
    tone: getEventTone(payload.eventType, payload.finishReason),
    highlightLevel: getEventHighlightLevel(payload.eventType, payload.finishReason),
    segments: [
      {
        kind: 'event',
        label: SEGMENT_META.event.label,
        text: buildEventFactText(payload, lead, turnNumber),
      },
      {
        kind: 'impact',
        label: SEGMENT_META.impact.label,
        text: buildEventImpactText(payload, story, turnNumber),
      },
      {
        kind: 'closure',
        label: SEGMENT_META.closure.label,
        text: buildEventClosureText(payload, story, turnNumber),
      },
    ],
    displayHints: {
      eventSemanticTag: payload.eventSemanticTag,
      pressureSide: story.pressureSide,
      eventType: payload.eventType,
      llmReady: true,
    },
  };
}

function buildFallbackResponse(envelope: NarrativeRequestEnvelope): NarrativeResponseEnvelope {
  if (envelope.itemType === 'turn') {
    const payload = envelope.itemPayload as TurnPayload;
    return {
      schemaVersion: 'v1',
      itemType: 'turn',
      title: `第 ${payload.turnNumber} 回合`,
      summary: clip(`你方 ${payload.userMove.from}→${payload.userMove.to}，AI ${payload.aiMove ? `${payload.aiMove.from}→${payload.aiMove.to}` : '未再应手'}。`, 76),
      tone: 'calm',
      highlightLevel: 'low',
      segments: [
        { kind: 'review', label: SEGMENT_META.review.label, text: `你方先走 ${payload.userMove.from}→${payload.userMove.to}，定性为 ${payload.userMove.semanticTag}。` },
        { kind: 'voices', label: SEGMENT_META.voices.label, text: '议论从简，先保留当前局面事实。' },
        { kind: 'consensus', label: SEGMENT_META.consensus.label, text: payload.storyThreadSummary.mainConflict },
        { kind: 'decision', label: SEGMENT_META.decision.label, text: payload.aiMove ? `AI 最终应手 ${payload.aiMove.from}→${payload.aiMove.to}。` : '本回合后局面已直接收口。' },
      ],
    };
  }

  const payload = envelope.itemPayload as NarrativeEventPayload;
  return {
    schemaVersion: 'v1',
    itemType: 'event',
    title: payload.eventType === 'undo' ? '悔棋事件' : payload.eventType === 'illegal_move' ? '非法落子' : '特殊事件',
    summary: clip(payload.eventReason, 72),
    tone: payload.eventType === 'illegal_move' ? 'warning' : 'calm',
    highlightLevel: payload.eventType === 'illegal_move' || payload.eventType === 'undo' ? 'medium' : 'low',
    segments: [
      { kind: 'event', label: SEGMENT_META.event.label, text: payload.eventReason },
      { kind: 'impact', label: SEGMENT_META.impact.label, text: payload.stateImpact },
      { kind: 'closure', label: SEGMENT_META.closure.label, text: payload.storyThreadSummary.carryForward },
    ],
  };
}

function generateNarrative(envelope: NarrativeRequestEnvelope, theme: ThemeKey): NarrativeResponseEnvelope {
  return envelope.itemType === 'turn'
    ? composeTurnNarrative(envelope, theme)
    : composeEventNarrative(envelope, theme);
}

export function resolveTimelineItem(
  id: string,
  order: number,
  envelope: NarrativeRequestEnvelope,
  theme: ThemeKey,
  options: ComposeOptions = {},
): TimelineItem {
  const generator = options.generator ?? generateNarrative;

  let response: NarrativeResponseEnvelope;
  let fallbackUsed = false;
  try {
    const candidate = generator(envelope, theme);
    if (!isNarrativeResponseEnvelope(candidate, envelope.itemType)) {
      fallbackUsed = true;
      logNarrativeFailure({
        failureReason: 'schema_invalid',
        turnType: envelope.itemType,
        eventType: envelope.itemType === 'event' ? (envelope.itemPayload as NarrativeEventPayload).eventType : 'none',
      });
      response = buildFallbackResponse(envelope);
    } else {
      response = candidate;
    }
  } catch (error) {
    fallbackUsed = true;
    logNarrativeFailure({
      failureReason: error instanceof Error ? error.message : 'generator_failed',
      turnType: envelope.itemType,
      eventType: envelope.itemType === 'event' ? (envelope.itemPayload as NarrativeEventPayload).eventType : 'none',
    });
    response = buildFallbackResponse(envelope);
  }

  return {
    id,
    kind: envelope.itemType,
    order,
    title: response.title,
    summary: response.summary,
    tone: mapTone(response.tone),
    highlightLevel: response.highlightLevel,
    segments: response.segments.map((segment, index) => makeSegment(`${id}-${segment.kind}-${index}`, segment)),
    meta: envelope.itemType === 'turn'
      ? {
        turnNumber: (envelope.itemPayload as TurnPayload).turnNumber,
        tag: (envelope.itemPayload as TurnPayload).turnArc,
        fallbackUsed,
      }
      : {
        turnNumber: (envelope.itemPayload as NarrativeEventPayload).eventAtTurn,
        eventType: (envelope.itemPayload as NarrativeEventPayload).eventType,
        tag: (envelope.itemPayload as NarrativeEventPayload).eventSemanticTag,
        fallbackUsed,
      },
  };
}

export function buildTimelineItems(
  game: GameSummary | null,
  theme: ThemeKey,
  runtimeEvents: RuntimeTimelineEvent[] = [],
  options: ComposeOptions = {},
): TimelineItem[] {
  const turnItems = !game?.moves.length
    ? []
    : [...new Map(game.moves.map((move) => [move.turnNumber, game.moves.filter((candidate) => candidate.turnNumber === move.turnNumber)])).entries()]
      .sort(([left], [right]) => left - right)
      .map(([turnNumber, moves]) => resolveTimelineItem(`turn-${turnNumber}`, turnNumber * 2, buildTurnEnvelope(game, turnNumber, moves, theme), theme, options));

  const eventItems = runtimeEvents.map((event) => resolveTimelineItem(event.id, event.order, event.envelope, theme, options));
  return [...turnItems, ...eventItems].sort((left, right) => right.order - left.order);
}

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

function buildBaseEnvelope(
  game: GameSummary,
  theme: ThemeKey,
  order: number,
  payload: NarrativeEventPayload,
  maxChars = 160,
): RuntimeTimelineEvent {
  const highlightLevel = getEventHighlightLevel(payload.eventType, payload.finishReason);
  return {
    id: `event-${payload.eventType}-${order}`,
    order,
    envelope: {
      schemaVersion: 'v1',
      requestId: createRequestId(`event-${payload.eventType}`, order),
      gameContext: {
        gameId: game.id,
        turnNumber: payload.eventAtTurn,
        userSide: game.userSide,
        aiSide: game.aiSide,
        difficulty: game.difficulty,
        gameStatus: game.status,
        isCheck: game.isCheck,
        isGameEnding: game.status !== 'ONGOING',
        storyThreadSummary: payload.storyThreadSummary,
      },
      themeContext: buildThemeContext(theme),
      roleContext: buildRoleContext(payload.eventAtTurn, highlightLevel),
      itemType: 'event',
      itemPayload: payload,
      constraints: {
        maxChars,
        segmentCount: 3,
        language: 'zh-CN',
        mustStayGroundedInFacts: true,
        allowWorldExpansion: false,
        mustReturnJson: true,
      },
      fallbackPolicy: {
        fallbackMode: 'template-minimal',
        timeoutMs: payload.eventType === 'check' || payload.eventType === 'finish' ? 1800 : 1200,
        onSchemaInvalid: 'fallback',
        onEmptyResponse: 'fallback',
      },
    },
  };
}

function currentSummary(game: GameSummary | null) {
  return game?.storyThreadSummary ?? DEFAULT_STORY_THREAD_SUMMARY;
}

function currentTurnNumber(game: GameSummary | null) {
  if (!game) {
    return 1;
  }

  return Math.floor(game.moves.length / 2) + 1;
}

export function buildErrorEvent(game: GameSummary | null, theme: ThemeKey, error: ApiErrorInfo, attemptedMove: string | undefined, order: number): RuntimeTimelineEvent {
  const summary = currentSummary(game);
  const turnNumber = currentTurnNumber(game);

  if (error.code === 'ILLEGAL_MOVE') {
    return buildBaseEnvelope(game ?? {
      id: 'local-event',
      status: 'ONGOING',
      difficulty: 'NORMAL',
      currentFen: '',
      undoCount: 0,
      canUndo: false,
      moves: [],
      userSide: 'red',
      aiSide: 'black',
      currentTurn: 'USER',
      isCheck: false,
      resultWinner: null,
      endedByResign: false,
      storyThreadSummary: summary,
      startedAt: '',
      updatedAt: '',
      endedAt: null,
    }, theme, order, {
      eventType: 'illegal_move',
      eventAtTurn: turnNumber,
      eventActor: 'USER',
      relatedMove: attemptedMove ? { from: attemptedMove.split(' → ')[0] ?? '--', to: attemptedMove.split(' → ')[1] ?? '--' } : undefined,
      eventReason: error.detail ?? error.message,
      eventSemanticTag: '军议否决',
      stateImpact: '棋盘保持原状，当前回合未推进。',
      narrativeGoal: '以剧情化但克制的方式说明该方案被否决。',
      storyThreadSummary: summary,
      extensions: {
        validationStage: 'rule_check',
        llmContext: {
          eventFrame: 'move_rejected',
          shouldAdvanceTurn: false,
          retryExpected: true,
        },
      },
    }, 150);
  }

  return buildBaseEnvelope(game ?? {
    id: 'local-event',
    status: 'ONGOING',
    difficulty: 'NORMAL',
    currentFen: '',
    undoCount: 0,
    canUndo: false,
    moves: [],
    userSide: 'red',
    aiSide: 'black',
    currentTurn: 'USER',
    isCheck: false,
    resultWinner: null,
    endedByResign: false,
    storyThreadSummary: summary,
    startedAt: '',
    updatedAt: '',
    endedAt: null,
  }, theme, order, {
    eventType: 'finish',
    eventAtTurn: turnNumber,
    eventActor: 'SYSTEM',
    eventReason: error.detail ?? error.message,
    eventSemanticTag: '规则裁断',
    stateImpact: '本次操作未能完成，但统一时间线仍然保留了事件记录。',
    narrativeGoal: '说明系统事件失败，但不要打断已有时间线。',
    storyThreadSummary: summary,
    finishReason: 'rule_settlement',
  }, 140);
}

export function buildUndoEvent(game: GameSummary, theme: ThemeKey, revertedTurnNumber: number, order: number): RuntimeTimelineEvent {
  return buildBaseEnvelope(game, theme, order, {
    eventType: 'undo',
    eventAtTurn: revertedTurnNumber,
    eventActor: 'USER',
    eventReason: '最近一个完整回合已被撤回，当前回到上一个判断点。',
    eventSemanticTag: '推演回拨',
    stateImpact: `棋盘已回退；悔棋次数更新为 ${game.undoCount}/5。`,
    narrativeGoal: '以克制方式说明推演回拨，不把它写成普通回合。',
    storyThreadSummary: game.storyThreadSummary,
    extensions: {
      undoCountUsed: game.undoCount,
      undoCountRemaining: Math.max(0, 5 - game.undoCount),
      llmContext: {
        eventFrame: 'round_rewind',
        shouldAdvanceTurn: false,
        resumeFromCarryForward: game.storyThreadSummary.carryForward,
      },
    },
  }, 180);
}

export function buildCheckEvent(game: GameSummary, theme: ThemeKey, order: number): RuntimeTimelineEvent {
  return buildBaseEnvelope(game, theme, order, {
    eventType: 'check',
    eventAtTurn: Math.ceil(game.moves.length / 2),
    eventActor: 'AI',
    eventReason: 'AI 的应手已经把帅门压紧。',
    eventSemanticTag: '正面施压',
    stateImpact: '下一步必须优先解将，否则主线会继续向 AI 一侧倾斜。',
    narrativeGoal: '把将军写成明确压力，而不是普通提示。',
    storyThreadSummary: game.storyThreadSummary,
    extensions: {
      llmContext: {
        eventFrame: 'forced_response',
        urgency: 'high',
        mustResolveBeforeExpansion: true,
      },
    },
  }, 190);
}

export function buildFinishEvent(game: GameSummary, theme: ThemeKey, order: number): RuntimeTimelineEvent {
  const finishReason: FinishReason = game.status === 'CHECKMATED'
    ? 'checkmate'
    : game.status === 'RESIGNED'
      ? 'resign'
      : 'rule_settlement';

  return buildBaseEnvelope(game, theme, order, {
    eventType: game.status === 'RESIGNED' ? 'resign' : 'finish',
    eventAtTurn: Math.max(1, Math.ceil(game.moves.length / 2)),
    eventActor: game.status === 'RESIGNED' ? 'USER' : 'SYSTEM',
    eventReason: game.status === 'RESIGNED'
      ? '本局已按认输结束。'
      : game.status === 'CHECKMATED'
        ? '本局已形成将死。'
        : '本局已由系统裁断收束。',
    eventSemanticTag: game.status === 'RESIGNED'
      ? '主动收局'
      : finishReason === 'checkmate'
        ? '胜负已定'
        : '规则裁断',
    stateImpact: game.status === 'RESIGNED'
      ? '对局立即终止，讨论区同步收束。'
      : finishReason === 'checkmate'
        ? '胜负已经明确，后续不再继续推进回合。'
        : '棋局不再继续扩张，本轮按系统裁断收尾。',
    narrativeGoal: '给终局一个收束感，同时保持事实优先。',
    storyThreadSummary: game.storyThreadSummary,
    finishReason,
    extensions: {
      llmContext: {
        eventFrame: game.status === 'RESIGNED' ? 'voluntary_finish' : 'terminal_resolution',
        terminal: true,
        shouldOpenNewBranch: false,
      },
    },
  }, 220);
}
