import { Difficulty } from '@prisma/client';
import {
  DEFAULT_STORY_THREAD_SUMMARY,
  TURN_ARCS,
  type DecisionResult,
  type MoveTag,
  type PressureSide,
  type RiskLevel,
  type RuleMove,
  type StoryPhase,
  type StoryThreadSummary,
  type TurnArc,
} from '@xiangqi-web/shared';
import { parseFen } from 'elephantops/fen';
import { Xiangqi } from 'elephantops/xiangqi';
import { parseSquare } from 'elephantops/util';
import type { Color, Role } from 'elephantops';
import type { RuleAdapter } from '../../rules/types.js';
import type { PersistedMoveRecord } from '../../game/types.js';

const PIECE_SCORES: Record<Role, number> = {
  king: 10_000,
  chariot: 900,
  cannon: 450,
  horse: 400,
  elephant: 200,
  advisor: 200,
  pawn: 100,
};

const PIECE_LABELS: Record<string, string> = {
  K: '帅',
  A: '仕',
  B: '相',
  N: '马',
  R: '车',
  C: '炮',
  P: '兵',
  k: '将',
  a: '士',
  b: '象',
  n: '马',
  r: '车',
  c: '炮',
  p: '卒',
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

function pieceLabel(code?: string) {
  return code ? (PIECE_LABELS[code] ?? '子') : '子';
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

function evaluateMove(fen: string, move: RuleMove, color: Color, rules: RuleAdapter) {
  const from = parseSquare(move.from);
  const to = parseSquare(move.to);
  if (from === undefined || to === undefined) {
    return Number.NEGATIVE_INFINITY;
  }

  const position = createPosition(fen);
  const capturedPiece = position.board.get(to);
  const applied = rules.applyMove(fen, move);
  if (!applied.ok) {
    return Number.NEGATIVE_INFINITY;
  }

  const nextPosition = createPosition(applied.nextFen);
  const captureScore = capturedPiece ? PIECE_SCORES[capturedPiece.role] * 3 : 0;
  const checkBonus = nextPosition.isCheck() ? 130 : 0;
  const mobilityPenalty = rules.getLegalMoves(applied.nextFen).length * 2;
  const finishBonus = applied.summary.isCheckmate ? 50_000 : applied.summary.isStalemate ? -180 : 0;

  return materialScore(applied.nextFen, color) + captureScore + checkBonus + finishBonus - mobilityPenalty;
}

function chooseIndex(difficulty: Difficulty, total: number) {
  switch (difficulty) {
    case Difficulty.BEGINNER:
      return Math.min(total - 1, Math.floor(total * 0.65));
    case Difficulty.NORMAL:
      return Math.min(total - 1, Math.floor(total * 0.35));
    case Difficulty.HARD:
      return Math.min(total - 1, 1);
    case Difficulty.MASTER:
    default:
      return 0;
  }
}

function classifyMove(
  move: RuleMove,
  fenBefore: string,
  fenAfter: string,
  rules: RuleAdapter,
  actor: 'USER' | 'AI',
): MoveTag {
  const beforeState = rules.getGameState(fenBefore);
  const afterState = rules.getGameState(fenAfter);
  const piece = move.piece ?? '';
  const pieceUpper = piece.toUpperCase();
  const isCapture = Boolean(move.captured);
  const isKingLike = pieceUpper === 'K' || pieceUpper === 'A' || pieceUpper === 'B';
  const fileDelta = Math.abs(move.from.charCodeAt(0) - move.to.charCodeAt(0));
  const rankDelta = Math.abs(Number(move.from.slice(1)) - Number(move.to.slice(1)));
  const movedToCenter = ['d', 'e', 'f'].includes(move.to[0] ?? '');

  if (afterState.isCheckmate || afterState.isGameOver) {
    return '收束';
  }

  if (beforeState.isCheck && !afterState.isCheck) {
    return isKingLike ? '护驾' : '解围';
  }

  if (afterState.isCheck) {
    return '压迫';
  }

  if (isCapture) {
    return move.captured?.toUpperCase() === pieceUpper ? '换子' : '追击';
  }

  if (movedToCenter || fileDelta >= 2) {
    return '抢位';
  }

  if (rankDelta >= 2 && actor === 'AI') {
    return '压迫';
  }

  if (rankDelta === 0 && fileDelta === 0) {
    return '试探';
  }

  return pieceUpper === 'C' || pieceUpper === 'N' ? '佯动' : '试探';
}

function isPressureMove(tag: MoveTag) {
  return tag === '压迫' || tag === '追击' || tag === '收束';
}

function isReliefMove(tag: MoveTag) {
  return tag === '护驾' || tag === '解围';
}

function isPositioningMove(tag: MoveTag) {
  return tag === '抢位' || tag === '换子';
}

function derivePressureSide(userMoveTag: MoveTag, aiMoveTag: MoveTag, aiSummary: ReturnType<RuleAdapter['getGameState']>): PressureSide {
  if (aiSummary.isCheck || isPressureMove(aiMoveTag)) {
    return 'BLACK';
  }

  if (isPressureMove(userMoveTag)) {
    return 'RED';
  }

  if (isReliefMove(userMoveTag) && !isPressureMove(aiMoveTag)) {
    return 'RED';
  }

  return 'BALANCED';
}

function deriveTurnArc(userMoveTag: MoveTag, aiMoveTag: MoveTag, isCheck: boolean, isFinishing: boolean): TurnArc {
  if (isFinishing || aiMoveTag === '收束') {
    return '收束临门';
  }

  if (isCheck || aiMoveTag === '压迫' || aiMoveTag === '追击') {
    return '压力升级';
  }

  if (userMoveTag === '压迫' && isReliefMove(aiMoveTag)) {
    return '攻守换边';
  }

  if (isReliefMove(userMoveTag) || isReliefMove(aiMoveTag)) {
    return '稳阵解围';
  }

  if (isPositioningMove(userMoveTag) && isPositioningMove(aiMoveTag)) {
    return '抢势加码';
  }

  return TURN_ARCS[0];
}

function derivePhase(turnArc: TurnArc, userMoveTag: MoveTag, aiMoveTag: MoveTag): StoryPhase {
  if (turnArc === '收束临门' || aiMoveTag === '收束') {
    return '收束期';
  }

  if (turnArc === '稳阵解围' || isReliefMove(userMoveTag)) {
    return '解围期';
  }

  if (turnArc === '压力升级' || aiMoveTag === '压迫' || aiMoveTag === '追击') {
    return '对压期';
  }

  if (turnArc === '抢势加码' || userMoveTag === '抢位' || aiMoveTag === '抢位') {
    return '抢势期';
  }

  return '试探期';
}

function deriveRecentFocus(userMoveTag: MoveTag, aiMoveTag: MoveTag, pressureSide: PressureSide) {
  if (pressureSide === 'BLACK') {
    return aiMoveTag === '压迫' ? '中路压力' : '黑方逼近';
  }

  if (pressureSide === 'RED') {
    return userMoveTag === '抢位' ? '红方抢势' : '红方回手';
  }

  if (userMoveTag === '护驾' || userMoveTag === '解围') {
    return '护驾与解围';
  }

  if (userMoveTag === '换子' || aiMoveTag === '换子') {
    return '换子后的布势';
  }

  return userMoveTag === '佯动' || aiMoveTag === '佯动' ? '边线佯动' : '开局试探';
}

function buildMainConflict(phase: StoryPhase, pressureSide: PressureSide, recentFocus: string) {
  if (pressureSide === 'BLACK') {
    return `黑方正把节奏压向 ${recentFocus}，红方暂时只能边稳边找回手。`;
  }

  if (pressureSide === 'RED') {
    return `红方刚在 ${recentFocus} 上抢回分寸，黑方需要重新校准压迫线。`;
  }

  if (phase === '解围期') {
    return `双方围着 ${recentFocus} 反复拆招，局面还没有真正写平。`;
  }

  return `双方仍在围绕 ${recentFocus} 试探与换位，主线已经显影但未定局。`;
}

function buildCarryForward(phase: StoryPhase, pressureSide: PressureSide, recentFocus: string) {
  if (phase === '收束期') {
    return '下一回合重点不是铺陈辞藻，而是把收束感稳稳压实。';
  }

  if (pressureSide === 'BLACK') {
    return `下一回合继续强调黑方在 ${recentFocus} 上的压迫，不要提前写成翻盘。`;
  }

  if (pressureSide === 'RED') {
    return `下一回合要继续盯住 ${recentFocus}，别把红方刚抢回的主动写散。`;
  }

  return `下一回合仍围绕 ${recentFocus} 看谁先把试探落成真正优势。`;
}

function clampSummary(summary: StoryThreadSummary): StoryThreadSummary {
  const clip = (value: string, max: number) => (value.length > max ? `${value.slice(0, max - 1)}…` : value);

  return {
    currentPhase: summary.currentPhase,
    mainConflict: clip(summary.mainConflict, 72),
    pressureSide: summary.pressureSide,
    recentFocus: clip(summary.recentFocus, 18),
    carryForward: clip(summary.carryForward, 72),
  };
}

function buildStoryThreadSummary(
  history: PersistedMoveRecord[],
  current: {
    userMoveTag: MoveTag;
    aiMoveTag: MoveTag;
    turnArc: TurnArc;
    pressureSide: PressureSide;
  },
): StoryThreadSummary {
  const latestPrevious = [...history].reverse().find((record) => record.actor === 'AI' && record.decision?.storyThreadSummary)?.decision?.storyThreadSummary;
  const phase = derivePhase(current.turnArc, current.userMoveTag, current.aiMoveTag);
  const recentFocus = deriveRecentFocus(current.userMoveTag, current.aiMoveTag, current.pressureSide);
  const base = latestPrevious ?? DEFAULT_STORY_THREAD_SUMMARY;

  return clampSummary({
    currentPhase: phase,
    pressureSide: current.pressureSide,
    recentFocus,
    mainConflict: buildMainConflict(phase, current.pressureSide, recentFocus),
    carryForward: buildCarryForward(phase, current.pressureSide, recentFocus),
  });
}

function buildHighlightReason(move: RuleMove, aiSummary: ReturnType<RuleAdapter['getGameState']>) {
  const reasons: string[] = [];

  if (aiSummary.isCheck) {
    reasons.push('将军');
  }

  if (move.captured) {
    reasons.push(move.captured.toUpperCase() === 'P' ? '吃子压缩空间' : '关键换子');
  }

  if (!reasons.length && (move.piece?.toUpperCase() === 'R' || move.piece?.toUpperCase() === 'C')) {
    reasons.push('重子逼近');
  }

  return reasons.slice(0, 2);
}

function deriveRiskLevel(userMoveTag: MoveTag, aiMoveTag: MoveTag, aiSummary: ReturnType<RuleAdapter['getGameState']>): RiskLevel {
  if (aiSummary.isCheck || aiMoveTag === '收束') {
    return 'high';
  }

  if (userMoveTag === '压迫' || aiMoveTag === '压迫' || aiMoveTag === '追击') {
    return 'medium';
  }

  return 'low';
}

function buildSituationShift(
  userMoveTag: MoveTag,
  aiMoveTag: MoveTag,
  pressureSide: PressureSide,
  turnArc: TurnArc,
  aiMove: RuleMove,
) {
  const aiPiece = pieceLabel(aiMove.piece);

  if (turnArc === '收束临门') {
    return `这一来一回已经逼近收束，${aiPiece} 的应手把胜负讨论从铺排推到了落槌边缘。`;
  }

  if (pressureSide === 'BLACK') {
    return `你方这步偏向${userMoveTag}，黑方随即以${aiMoveTag}回应，局面开始朝黑方更擅长的压迫线偏转。`;
  }

  if (pressureSide === 'RED') {
    return `你方的${userMoveTag}没有白费，黑方虽以${aiMoveTag}应手，但主动权已不再完全向黑方一侧倾斜。`;
  }

  return `这一回合从${userMoveTag}推进到${aiMoveTag}，双方都还在争抢下一拍的先手。`;
}

export class StandardAiDecisionEngine {
  constructor(private readonly rules: RuleAdapter) {}

  decide(input: {
    fenAfterUserMove: string;
    difficulty: Difficulty;
    history: PersistedMoveRecord[];
    userMove: PersistedMoveRecord;
    userFenBefore: string;
  }): DecisionResult {
    const legalMoves = this.rules.getLegalMoves(input.fenAfterUserMove);
    if (!legalMoves.length) {
      throw new Error('No legal move available for AI');
    }

    const scoredMoves = legalMoves
      .map((move) => ({
        move,
        score: evaluateMove(input.fenAfterUserMove, move, 'black', this.rules),
      }))
      .sort((left, right) => {
        if (right.score !== left.score) {
          return right.score - left.score;
        }

        return `${left.move.from}${left.move.to}`.localeCompare(`${right.move.from}${right.move.to}`);
      });

    const chosenMove = scoredMoves[chooseIndex(input.difficulty, scoredMoves.length)]?.move ?? scoredMoves[0].move;
    const aiApplied = this.rules.applyMove(input.fenAfterUserMove, chosenMove);
    if (!aiApplied.ok) {
      throw new Error('Decision engine selected illegal move');
    }

    const userMoveTag = classifyMove(input.userMove, input.userFenBefore, input.fenAfterUserMove, this.rules, 'USER');
    const aiMoveTag = classifyMove(chosenMove, input.fenAfterUserMove, aiApplied.nextFen, this.rules, 'AI');
    const pressureSide = derivePressureSide(userMoveTag, aiMoveTag, aiApplied.summary);
    const turnArc = deriveTurnArc(userMoveTag, aiMoveTag, aiApplied.summary.isCheck, aiApplied.summary.isGameOver);
    const storyThreadSummary = buildStoryThreadSummary(input.history, {
      userMoveTag,
      aiMoveTag,
      turnArc,
      pressureSide,
    });
    const highlightReason = buildHighlightReason(chosenMove, aiApplied.summary);

    return {
      chosenMove,
      userMoveTag,
      aiMoveTag,
      situationShift: buildSituationShift(userMoveTag, aiMoveTag, pressureSide, turnArc, chosenMove),
      turnArc,
      storyThreadSummary,
      highlightReason: highlightReason.length ? highlightReason : undefined,
      riskLevel: deriveRiskLevel(userMoveTag, aiMoveTag, aiApplied.summary),
      pressureSide,
    };
  }

  buildFallbackDecision(input: {
    fenAfterUserMove: string;
    difficulty: Difficulty;
    history: PersistedMoveRecord[];
    userMove: PersistedMoveRecord;
    userFenBefore: string;
  }): DecisionResult {
    const fallbackMove = this.rules.getLegalMoves(input.fenAfterUserMove)[0];
    if (!fallbackMove) {
      throw new Error('No legal move available for fallback decision');
    }

    const aiApplied = this.rules.applyMove(input.fenAfterUserMove, fallbackMove);
    if (!aiApplied.ok) {
      throw new Error('Fallback decision selected illegal move');
    }

    const userMoveTag = classifyMove(input.userMove, input.userFenBefore, input.fenAfterUserMove, this.rules, 'USER');
    const aiMoveTag = classifyMove(fallbackMove, input.fenAfterUserMove, aiApplied.nextFen, this.rules, 'AI');
    const pressureSide = derivePressureSide(userMoveTag, aiMoveTag, aiApplied.summary);
    const turnArc = deriveTurnArc(userMoveTag, aiMoveTag, aiApplied.summary.isCheck, aiApplied.summary.isGameOver);

    return {
      chosenMove: fallbackMove,
      userMoveTag,
      aiMoveTag,
      situationShift: '标准决策层本回合退回稳定兜底路径，局面解释按最小结构保留。',
      turnArc,
      storyThreadSummary: buildStoryThreadSummary(input.history, {
        userMoveTag,
        aiMoveTag,
        turnArc,
        pressureSide,
      }),
      highlightReason: ['稳定兜底'],
      riskLevel: 'medium',
      pressureSide,
    };
  }
}
