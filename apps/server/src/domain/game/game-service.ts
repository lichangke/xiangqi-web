import { Difficulty, GameStatus, type GameSession, type PrismaClient } from '@prisma/client';
import type { GameActor } from '@xiangqi-web/shared';
import { StandardAiDecisionEngine } from '../ai/decision/standard-ai-decision.js';
import { DecisionProviderService } from '../ai/decision/decision-provider-service.js';
import type { MoveInput, RuleAdapter } from '../rules/types.js';
import { HttpError } from '../../utils/http-error.js';
import {
  parseMoveHistory,
  serializeMoveHistory,
  toGameSummary,
  type PersistedMoveRecord,
} from './types.js';

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

function assertDifficulty(value: string): Difficulty {
  if (Object.values(Difficulty).includes(value as Difficulty)) {
    return value as Difficulty;
  }

  throw new HttpError(400, 'GAME_BAD_REQUEST', '不支持的难度档位');
}

function deriveStatus(summary: { isCheckmate: boolean; isStalemate: boolean; isGameOver: boolean }) {
  if (summary.isCheckmate) {
    return GameStatus.CHECKMATED;
  }

  if (summary.isStalemate || summary.isGameOver) {
    return GameStatus.STALEMATE;
  }

  return GameStatus.ONGOING;
}

function pieceTypeLabel(code?: string) {
  return code ? (PIECE_LABELS[code] ?? '子') : undefined;
}

function logAiFailure(payload: { failureReason: string; turnType: 'turn' | 'event'; eventType: string }) {
  console.warn('[bundle-c-ai-fallback]', payload);
}

export class GameService {
  private readonly decisionEngine: StandardAiDecisionEngine;
  private readonly decisionProviderService: DecisionProviderService;

  constructor(
    private readonly prisma: PrismaClient,
    private readonly rules: RuleAdapter,
  ) {
    this.decisionEngine = new StandardAiDecisionEngine(rules);
    this.decisionProviderService = new DecisionProviderService(prisma, rules);
  }

  async createGame(userId: string, difficultyValue: string) {
    const difficulty = assertDifficulty(difficultyValue);
    const policy = await this.prisma.runtimePolicy.findUnique({ where: { policyKey: 'system' } });
    const maxOngoing = policy?.maxOngoingGamesPerUser ?? 1;
    const ongoingCount = await this.prisma.gameSession.count({
      where: {
        userId,
        status: GameStatus.ONGOING,
      },
    });

    if (ongoingCount >= maxOngoing) {
      throw new HttpError(409, 'GAME_ALREADY_ONGOING', '当前账号已有进行中的对局');
    }

    const fen = this.rules.getInitialFen();
    const game = await this.prisma.gameSession.create({
      data: {
        userId,
        difficulty,
        status: GameStatus.ONGOING,
        initialFen: fen,
        currentFen: fen,
      },
    });

    return this.buildGameView(game);
  }

  async getCurrentGame(userId: string) {
    const game = await this.prisma.gameSession.findFirst({
      where: {
        userId,
        status: GameStatus.ONGOING,
      },
      orderBy: { updatedAt: 'desc' },
    });

    if (!game) {
      return null;
    }

    return this.buildGameView(game);
  }

  async submitMove(userId: string, gameId: string, input: MoveInput) {
    const game = await this.getOwnedGame(userId, gameId);
    if (game.status !== GameStatus.ONGOING) {
      throw new HttpError(409, 'GAME_NOT_ACTIVE', '当前对局已结束，不能继续落子');
    }

    const userMoveResult = this.rules.applyMove(game.currentFen, input);
    if (!userMoveResult.ok) {
      throw new HttpError(422, 'ILLEGAL_MOVE', '这步棋不合棋规', userMoveResult.reason);
    }

    const history = parseMoveHistory(game.moveHistory);
    const turnNumber = Math.floor(history.length / 2) + 1;
    const userMoveRecord = this.createMoveRecord('USER', turnNumber, game.currentFen, userMoveResult.nextFen, userMoveResult.move);

    if (userMoveResult.summary.isGameOver) {
      const updatedGame = await this.prisma.gameSession.update({
        where: { id: game.id },
        data: {
          currentFen: userMoveResult.nextFen,
          moveHistory: serializeMoveHistory([...history, userMoveRecord]),
          status: deriveStatus(userMoveResult.summary),
          resultWinner: userMoveResult.summary.isCheckmate ? game.userSide : null,
          canUndo: false,
          endedByResign: false,
          endedAt: new Date(),
        },
      });

      const view = this.buildGameView(updatedGame);
      return {
        game: view,
        userMove: this.toPublicMove(userMoveRecord),
        aiMove: null,
      };
    }

    const decisionInput = {
      fenAfterUserMove: userMoveResult.nextFen,
      difficulty: game.difficulty,
      history,
      userMove: userMoveRecord,
      userFenBefore: game.currentFen,
    };

    let decision;
    const legalMoves = this.rules.getLegalMoves(userMoveResult.nextFen);
    try {
      const providerDecision = await this.decisionProviderService.resolveDecision({
        ...decisionInput,
        legalMoves,
      });

      if (providerDecision) {
        decision = this.decisionEngine.buildDecisionFromMove(decisionInput, providerDecision.move, providerDecision.reason);
      } else {
        decision = this.decisionEngine.decide(decisionInput);
      }
    } catch (error) {
      logAiFailure({
        failureReason: error instanceof Error ? error.message : 'decision_engine_failed',
        turnType: 'turn',
        eventType: 'none',
      });
      decision = this.decisionEngine.buildFallbackDecision(decisionInput);
    }

    const aiMoveResult = this.rules.applyMove(userMoveResult.nextFen, decision.chosenMove);
    if (!aiMoveResult.ok) {
      throw new HttpError(500, 'AI_ILLEGAL_MOVE', 'AI 候选步异常，未能生成合法应对');
    }

    const aiMoveRecord = this.createMoveRecord('AI', turnNumber, userMoveResult.nextFen, aiMoveResult.nextFen, aiMoveResult.move, decision);
    const finalStatus = deriveStatus(aiMoveResult.summary);
    const updatedGame = await this.prisma.gameSession.update({
      where: { id: game.id },
      data: {
        currentFen: aiMoveResult.nextFen,
        moveHistory: serializeMoveHistory([...history, userMoveRecord, aiMoveRecord]),
        status: finalStatus,
        resultWinner: finalStatus === GameStatus.CHECKMATED ? game.aiSide : null,
        canUndo: true,
        endedByResign: false,
        endedAt: finalStatus === GameStatus.ONGOING ? null : new Date(),
      },
    });

    return {
      game: this.buildGameView(updatedGame),
      userMove: this.toPublicMove(userMoveRecord),
      aiMove: this.toPublicMove(aiMoveRecord),
    };
  }

  async undoLastRound(userId: string, gameId: string) {
    const game = await this.getOwnedGame(userId, gameId);
    const policy = await this.prisma.runtimePolicy.findUnique({ where: { policyKey: 'system' } });
    const maxUndo = policy?.maxUndoPerGame ?? 5;

    if (game.undoCount >= maxUndo) {
      throw new HttpError(409, 'GAME_UNDO_LIMIT', '本局悔棋次数已用尽');
    }

    if (!game.canUndo) {
      throw new HttpError(409, 'GAME_UNDO_NOT_AVAILABLE', '当前不能连续悔棋，请先完成一次新的正常落子');
    }

    const history = parseMoveHistory(game.moveHistory);
    const aiMove = history.at(-1);
    const userMove = history.at(-2);

    if (!aiMove || !userMove || aiMove.actor !== 'AI' || userMove.actor !== 'USER' || aiMove.turnNumber !== userMove.turnNumber) {
      throw new HttpError(409, 'GAME_UNDO_NOT_AVAILABLE', '当前没有可撤销的完整回合');
    }

    const revertedHistory = history.slice(0, -2);
    const updatedGame = await this.prisma.gameSession.update({
      where: { id: game.id },
      data: {
        currentFen: userMove.fenBefore,
        moveHistory: serializeMoveHistory(revertedHistory),
        undoCount: game.undoCount + 1,
        canUndo: false,
        status: GameStatus.ONGOING,
        resultWinner: null,
        endedByResign: false,
        endedAt: null,
      },
    });

    return {
      game: this.buildGameView(updatedGame),
      revertedTurnNumber: userMove.turnNumber,
    };
  }

  async resignGame(userId: string, gameId: string) {
    const game = await this.getOwnedGame(userId, gameId);
    if (game.status !== GameStatus.ONGOING) {
      throw new HttpError(409, 'GAME_NOT_ACTIVE', '当前对局已结束，无法认输');
    }

    const updatedGame = await this.prisma.gameSession.update({
      where: { id: game.id },
      data: {
        status: GameStatus.RESIGNED,
        resultWinner: game.aiSide,
        endedByResign: true,
        canUndo: false,
        endedAt: new Date(),
      },
    });

    return this.buildGameView(updatedGame);
  }

  private async getOwnedGame(userId: string, gameId: string) {
    const game = await this.prisma.gameSession.findFirst({
      where: {
        id: gameId,
        userId,
      },
    });

    if (!game) {
      throw new HttpError(404, 'GAME_NOT_FOUND', '未找到指定对局');
    }

    return game;
  }

  private buildGameView(game: GameSession) {
    const history = parseMoveHistory(game.moveHistory);
    const gameState = this.rules.getGameState(game.currentFen);
    const currentTurn = game.status === GameStatus.ONGOING
      ? (gameState.nextTurn === 'r' ? 'USER' : 'AI')
      : null;

    return toGameSummary(game, history, currentTurn, gameState.isCheck);
  }

  private createMoveRecord(
    actor: GameActor,
    turnNumber: number,
    fenBefore: string,
    fenAfter: string,
    move: { from: string; to: string; san?: string; piece?: string; captured?: string },
    decision?: PersistedMoveRecord['decision'],
  ): PersistedMoveRecord {
    return {
      actor,
      turnNumber,
      fenBefore,
      fenAfter,
      from: move.from,
      to: move.to,
      san: move.san,
      piece: move.piece,
      captured: move.captured,
      pieceType: pieceTypeLabel(move.piece),
      capturedPieceType: pieceTypeLabel(move.captured),
      decision,
    };
  }

  private toPublicMove(move: PersistedMoveRecord) {
    return {
      actor: move.actor,
      turnNumber: move.turnNumber,
      from: move.from,
      to: move.to,
      san: move.san,
      piece: move.piece,
      captured: move.captured,
      pieceType: move.pieceType,
      capturedPieceType: move.capturedPieceType,
      decision: move.decision,
    };
  }
}
