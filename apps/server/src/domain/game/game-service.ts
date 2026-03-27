import { Difficulty, GameStatus, type PrismaClient } from '@prisma/client';
import type { RuleAdapter } from '../rules/types.js';
import { HttpError } from '../../utils/http-error.js';

function assertDifficulty(value: string): Difficulty {
  if (Object.values(Difficulty).includes(value as Difficulty)) {
    return value as Difficulty;
  }

  throw new HttpError(400, 'GAME_BAD_REQUEST', '不支持的难度档位');
}

export class GameService {
  constructor(
    private readonly prisma: PrismaClient,
    private readonly rules: RuleAdapter,
  ) {}

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
    return this.prisma.gameSession.create({
      data: {
        userId,
        difficulty,
        status: GameStatus.ONGOING,
        initialFen: fen,
        currentFen: fen,
      },
    });
  }

  async getCurrentGame(userId: string) {
    return this.prisma.gameSession.findFirst({
      where: {
        userId,
        status: GameStatus.ONGOING,
      },
      orderBy: { updatedAt: 'desc' },
    });
  }
}
