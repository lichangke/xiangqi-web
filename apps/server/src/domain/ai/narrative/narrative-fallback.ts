import type {
  NarrativeEventPayload,
  NarrativeRequestEnvelope,
  NarrativeResponseEnvelope,
  NarrativeTurnPayload,
  ThemeKey,
} from '@xiangqi-web/shared';

const ROLE_POOL = ['车', '马', '炮', '兵', '仕', '相', '帅'] as const;
const NARRATIVE_TONES = new Set(['calm', 'tense', 'warning', 'decisive', 'elegiac']);
const NARRATIVE_HIGHLIGHT_LEVELS = new Set(['low', 'medium', 'high']);

const THEME_COPY: Record<ThemeKey, {
  storyThemeId: string;
  storyThemeName: string;
  themeTone: string;
  doNotUseStyles: string[];
  intro: string[];
  roleVoices: string[];
  consensus: string[];
  close: string[];
  eventLead: Record<'illegal_move' | 'undo' | 'resign' | 'check' | 'finish', string>;
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

function clip(text: string, max: number) {
  return text.length > max ? `${text.slice(0, max - 1)}…` : text;
}

function pick<T>(list: readonly T[], seed: number, offset = 0): T {
  return list[(seed + offset) % list.length] ?? list[0]!;
}

function hashPayload(value: string) {
  return Array.from(value).reduce((sum, char, index) => sum + char.charCodeAt(0) * (index + 1), 0);
}

function getSeed(payload: NarrativeRequestEnvelope['itemPayload']) {
  if ('turnNumber' in payload) {
    return hashPayload([
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
    ].join(':'));
  }

  return hashPayload([
    payload.eventType,
    payload.eventAtTurn,
    payload.eventSemanticTag,
    payload.storyThreadSummary.currentPhase,
    payload.storyThreadSummary.pressureSide,
    payload.storyThreadSummary.recentFocus,
    payload.finishReason ?? 'none',
  ].join(':'));
}

function getRoles(turnNumber: number, count: number) {
  return Array.from({ length: count }, (_, index) => ROLE_POOL[(turnNumber + index) % ROLE_POOL.length]);
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

function normalizeTone(value: unknown, itemType: 'turn' | 'event') {
  if (typeof value === 'string' && NARRATIVE_TONES.has(value)) {
    return value as NarrativeResponseEnvelope['tone'];
  }

  return itemType === 'turn' ? 'calm' : 'warning';
}

function normalizeHighlightLevel(value: unknown) {
  if (typeof value === 'string' && NARRATIVE_HIGHLIGHT_LEVELS.has(value)) {
    return value as NarrativeResponseEnvelope['highlightLevel'];
  }

  return 'medium' as const;
}

function normalizeDisplayHints(value: unknown) {
  return value && typeof value === 'object' ? value as Record<string, unknown> : undefined;
}

function getFirstString(...values: unknown[]) {
  for (const value of values) {
    if (typeof value === 'string' && value.trim()) {
      return value.trim();
    }
  }
  return null;
}

function getTurnSegmentTexts(raw: Record<string, unknown>) {
  const segments = raw.segments;

  if (Array.isArray(segments)) {
    const segmentRows = segments.filter((segment): segment is Record<string, unknown> => Boolean(segment) && typeof segment === 'object');
    if (segmentRows.length) {
      const review = getFirstString(
        segmentRows.find((segment) => segment.kind === 'review')?.text,
        segmentRows.find((segment) => segment.type === 'narration')?.text,
      );
      const voices = segmentRows
        .filter((segment) => (segment.kind === 'voices' || segment.type === 'roleLine') && typeof segment.text === 'string')
        .map((segment) => segment.type === 'roleLine' && typeof segment.role === 'string' ? `${segment.role}：${segment.text as string}` : segment.text as string)
        .join(' ')
        .trim();
      const consensus = getFirstString(segmentRows.find((segment) => segment.kind === 'consensus')?.text);
      const decision = getFirstString(segmentRows.find((segment) => segment.kind === 'decision')?.text);

      return {
        review,
        voices: voices || null,
        consensus,
        decision,
        segmentRows,
      };
    }

    const texts = segments.filter((segment): segment is string => typeof segment === 'string' && segment.trim().length > 0);
    return {
      review: texts[0] ?? null,
      voices: texts[1] ?? null,
      consensus: texts[2] ?? null,
      decision: texts[3] ?? null,
      segmentRows: [],
    };
  }

  const segmentMap = segments && typeof segments === 'object' ? segments as Record<string, unknown> : null;
  return {
    review: getFirstString(raw.review, raw.narration, segmentMap?.review, segmentMap?.narration),
    voices: getFirstString(raw.voices, segmentMap?.voices),
    consensus: getFirstString(raw.consensus, segmentMap?.consensus),
    decision: getFirstString(raw.decision, raw.judgement, segmentMap?.decision, segmentMap?.judgement),
    segmentRows: [],
  };
}

function normalizeProviderTurnResponse(raw: Record<string, unknown>): NarrativeResponseEnvelope | null {
  const itemType = raw.itemType;
  if (itemType !== undefined && itemType !== 'turn') {
    return null;
  }

  const title = getFirstString(raw.title, raw.headline) ?? '本回合演绎';
  const summary = getFirstString(raw.summary, raw.brief, raw.overview);
  const { review, voices, consensus, decision, segmentRows } = getTurnSegmentTexts(raw);

  const tags = Array.isArray(raw.tags) ? raw.tags.filter((tag): tag is string => typeof tag === 'string' && tag.trim().length > 0) : [];
  const grounding = raw.grounding && typeof raw.grounding === 'object' ? raw.grounding as Record<string, unknown> : null;
  const userMove = grounding?.userMove && typeof grounding.userMove === 'object' ? grounding.userMove as Record<string, unknown> : null;
  const aiMove = grounding?.aiMove && typeof grounding.aiMove === 'object' ? grounding.aiMove as Record<string, unknown> : null;

  const userMoveText = userMove && typeof userMove.from === 'string' && typeof userMove.to === 'string'
    ? `${typeof userMove.pieceType === 'string' ? userMove.pieceType : '子'} ${userMove.from}→${userMove.to}`
    : '你方已落子';
  const aiMoveText = aiMove && typeof aiMove.from === 'string' && typeof aiMove.to === 'string'
    ? `${typeof aiMove.pieceType === 'string' ? aiMove.pieceType : '子'} ${aiMove.from}→${aiMove.to}`
    : '对手已应手';

  const normalizedSummary = summary
    ?? review
    ?? getFirstString(raw.fact, raw.analysis)
    ?? null;

  if (!normalizedSummary) {
    return null;
  }

  return {
    schemaVersion: 'v1',
    itemType: 'turn',
    title,
    summary: normalizedSummary,
    tone: normalizeTone(raw.tone, 'turn'),
    highlightLevel: normalizeHighlightLevel(raw.highlightLevel),
    segments: [
      {
        kind: 'review',
        label: '简评',
        text: review ?? normalizedSummary,
      },
      {
        kind: 'voices',
        label: '发言',
        text: voices ?? '当前没有额外角色发言。',
      },
      {
        kind: 'consensus',
        label: '共识',
        text: consensus ?? (tags.length ? `本回合关键词：${tags.join('、')}。` : `当前共识：${normalizedSummary}`),
      },
      {
        kind: 'decision',
        label: '落子',
        text: decision ?? `当前落点可概括为：${userMoveText}；${aiMoveText}。`,
      },
    ],
    displayHints: normalizeDisplayHints(raw.displayHints) ?? (segmentRows.length ? undefined : { compactProviderShape: true }),
  };
}

function normalizeProviderEventResponse(raw: Record<string, unknown>): NarrativeResponseEnvelope | null {
  const title = typeof raw.title === 'string' ? raw.title : null;
  const summary = typeof raw.summary === 'string' ? raw.summary : null;
  const itemType = raw.itemType;
  const segments = raw.segments;

  if (itemType !== 'event' || !title || !summary || !Array.isArray(segments) || segments.length === 0) {
    return null;
  }

  const texts = segments
    .filter((segment): segment is Record<string, unknown> => Boolean(segment) && typeof segment === 'object' && typeof segment.text === 'string')
    .map((segment) => segment.text as string);

  if (!texts.length) {
    return null;
  }

  return {
    schemaVersion: 'v1',
    itemType: 'event',
    title,
    summary,
    tone: normalizeTone(raw.tone, 'event'),
    highlightLevel: normalizeHighlightLevel(raw.highlightLevel),
    segments: [
      { kind: 'event', label: '事件', text: texts[0] ?? summary },
      { kind: 'impact', label: '影响', text: texts[1] ?? summary },
      { kind: 'closure', label: '结论', text: texts[2] ?? summary },
    ],
    displayHints: normalizeDisplayHints(raw.displayHints),
  };
}

function normalizeProviderNarrativeResponse(raw: unknown, itemType: 'turn' | 'event') {
  if (!raw || typeof raw !== 'object') {
    return null;
  }

  const candidate = raw as Record<string, unknown>;
  return itemType === 'turn'
    ? normalizeProviderTurnResponse(candidate)
    : normalizeProviderEventResponse(candidate);
}

export function buildServerFallbackNarrative(envelope: NarrativeRequestEnvelope, theme: ThemeKey): NarrativeResponseEnvelope {
  const copy = THEME_COPY[theme];
  const seed = getSeed(envelope.itemPayload);

  if (envelope.itemType === 'turn') {
    const payload = envelope.itemPayload as NarrativeTurnPayload;
    const userMoveText = `${payload.userMove.pieceType ?? '子'} ${payload.userMove.from}→${payload.userMove.to}`;
    const aiMoveText = payload.aiMove ? `${payload.aiMove.pieceType ?? '子'} ${payload.aiMove.from}→${payload.aiMove.to}` : '残局直接收口';
    const roles = getRoles(payload.turnNumber, payload.highlightReason?.length && payload.highlightReason.length > 1 ? 4 : 3);
    const review = [
      `${pick(copy.intro, seed)} ${userMoveText} 先把这一拍挑开，${aiMoveText} 再把回应压到盘上。`,
      `${payload.situationShift} ${payload.capture ? '这一来一回还带出了交换。' : ''} ${payload.checkState.after ? '这一应手之后，将军压力被直接摆上了桌面。' : ''}`,
    ].join(' ').replace(/\s+/g, ' ').trim();
    const consensus = `${pick(copy.consensus, seed)}${payload.storyThreadSummary.mainConflict} 接下来先看 ${payload.storyThreadSummary.recentFocus} 会往哪边落。`;
    const decision = `${aiMoveText} 被落成这一手，核心还是：${payload.storyThreadSummary.carryForward} ${payload.highlightReason?.length ? `本回合最亮的信号是 ${payload.highlightReason.join('、')}。` : pick(copy.close, seed)}`;

    return {
      schemaVersion: 'v1',
      itemType: 'turn',
      title: `第 ${payload.turnNumber} 回合`,
      summary: clip(`你方 ${userMoveText}，AI ${payload.aiMove ? aiMoveText : '未再应手'}。`, 88),
      tone: payload.checkState.after || payload.turnArc === '收束临门' ? 'tense' : payload.highlightReason?.length ? 'decisive' : 'calm',
      highlightLevel: payload.highlightReason?.length && payload.highlightReason.length > 1 ? 'high' : payload.checkState.after || payload.highlightReason?.length ? 'medium' : 'low',
      segments: [
        { kind: 'review', label: '简评', text: review },
        { kind: 'voices', label: '发言', text: roles.map((role, index) => `${role}：${pick(copy.roleVoices, seed, index)}`).join(' ') },
        { kind: 'consensus', label: '共识', text: consensus },
        { kind: 'decision', label: '落子', text: decision },
      ],
      displayHints: {
        storyPhase: payload.storyThreadSummary.currentPhase,
        pressureSide: payload.storyThreadSummary.pressureSide,
        llmReady: false,
      },
    };
  }

  const payload = envelope.itemPayload as NarrativeEventPayload;
  const lead = copy.eventLead[payload.eventType];
  return {
    schemaVersion: 'v1',
    itemType: 'event',
    title: payload.eventType === 'undo' ? '悔棋事件' : payload.eventType === 'illegal_move' ? '非法落子' : payload.eventType === 'resign' ? '认输事件' : payload.eventType === 'check' ? '将军提醒' : '终局反馈',
    summary: clip(`${lead}：${payload.eventReason}`, 84),
    tone: payload.eventType === 'illegal_move' ? 'warning' : payload.eventType === 'undo' ? 'elegiac' : payload.eventType === 'check' ? 'tense' : payload.eventType === 'resign' || payload.finishReason === 'checkmate' ? 'decisive' : 'calm',
    highlightLevel: payload.eventType === 'check' || payload.eventType === 'resign' || payload.finishReason === 'checkmate' ? 'high' : payload.eventType === 'illegal_move' || payload.eventType === 'undo' ? 'medium' : 'low',
    segments: [
      { kind: 'event', label: '事件', text: `${lead}拦下的是这一拍，原因很直接：${payload.eventReason}` },
      { kind: 'impact', label: '影响', text: `${payload.stateImpact} 当前焦点仍卡在 ${payload.storyThreadSummary.recentFocus}。` },
      { kind: 'closure', label: '结论', text: `${payload.storyThreadSummary.carryForward}` },
    ],
    displayHints: {
      eventSemanticTag: payload.eventSemanticTag,
      pressureSide: payload.storyThreadSummary.pressureSide,
      eventType: payload.eventType,
      llmReady: false,
    },
  };
}

export function parseNarrativeResponse(raw: unknown, itemType: 'turn' | 'event') {
  if (isNarrativeResponseEnvelope(raw, itemType)) {
    return raw;
  }

  return normalizeProviderNarrativeResponse(raw, itemType);
}
