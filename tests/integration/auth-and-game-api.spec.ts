import { beforeAll, beforeEach, describe, expect, it } from 'vitest';
import { PrismaClient } from '@prisma/client';
import bcrypt from 'bcryptjs';
import { buildApp } from '../../apps/server/src/app.js';
import { XiangqiRuleAdapter } from '../../apps/server/src/domain/rules/xiangqi-rule-adapter.js';

const prisma = new PrismaClient();
const app = buildApp({ prisma });
const rules = new XiangqiRuleAdapter();

let adminToken = '';
let demoToken = '';
let demoUserId = '';

async function login(username: string, password: string) {
  const response = await app.inject({
    method: 'POST',
    url: '/api/auth/login',
    payload: { username, password },
  });

  expect(response.statusCode).toBe(200);
  return response.json();
}

async function createGame() {
  const response = await app.inject({
    method: 'POST',
    url: '/api/games',
    headers: { authorization: `Bearer ${demoToken}` },
    payload: { difficulty: 'NORMAL' },
  });

  expect(response.statusCode).toBe(201);
  return response.json().game as { id: string; currentFen: string; status: string; canUndo: boolean };
}

beforeAll(async () => {
  await app.ready();
});

beforeEach(async () => {
  await prisma.auditLog.deleteMany();
  await prisma.gameSession.deleteMany();
  await prisma.userPreference.deleteMany();
  await prisma.user.deleteMany();
  await prisma.runtimePolicy.upsert({
    where: { policyKey: 'system' },
    update: { maxOngoingGamesPerUser: 1, maxUndoPerGame: 5 },
    create: {
      policyKey: 'system',
      maxConcurrentAiGames: 20,
      maxOngoingGamesPerUser: 1,
      maxUndoPerGame: 5,
      registrationMode: 'CLOSED',
    },
  });

  const adminPasswordHash = await bcrypt.hash('admin123', 10);
  const demoPasswordHash = await bcrypt.hash('demo123', 10);

  const [admin, demo] = await Promise.all([
    prisma.user.create({
      data: {
        username: 'admin',
        passwordHash: adminPasswordHash,
        role: 'ADMIN',
        preferences: { create: {} },
      },
    }),
    prisma.user.create({
      data: {
        username: 'demo',
        passwordHash: demoPasswordHash,
        role: 'USER',
        preferences: { create: {} },
      },
    }),
  ]);

  demoUserId = demo.id;
  adminToken = (await login('admin', 'admin123')).token;
  demoToken = (await login('demo', 'demo123')).token;
});

describe('auth and game APIs', () => {
  it('should login and read current user profile with preferences and recent games', async () => {
    await prisma.userPreference.update({
      where: { userId: demoUserId },
      data: { theme: 'midnight' },
    });

    await prisma.gameSession.create({
      data: {
        userId: demoUserId,
        difficulty: 'NORMAL',
        status: 'RESIGNED',
        initialFen: 'fen-a',
        currentFen: 'fen-a',
        endedByResign: true,
        endedAt: new Date(),
      },
    });

    const relogin = await app.inject({
      method: 'POST',
      url: '/api/auth/login',
      payload: { username: 'demo', password: 'demo123' },
    });

    expect(relogin.statusCode).toBe(200);
    expect(relogin.json().preferences.theme).toBe('midnight');
    expect(relogin.json().recentGames).toHaveLength(1);

    const me = await app.inject({
      method: 'GET',
      url: '/api/auth/me',
      headers: { authorization: `Bearer ${demoToken}` },
    });

    expect(me.statusCode).toBe(200);
    expect(me.json().user.username).toBe('demo');
    expect(me.json().preferences.theme).toBe('midnight');
    expect(Array.isArray(me.json().recentGames)).toBe(true);
  });

  it('should create a game and then read current ongoing game', async () => {
    const createdGame = await createGame();

    const current = await app.inject({
      method: 'GET',
      url: '/api/games/current',
      headers: { authorization: `Bearer ${demoToken}` },
    });

    expect(current.statusCode).toBe(200);
    expect(current.json().game.id).toBe(createdGame.id);
    expect(current.json().game.currentFen).toBeTruthy();
    expect(current.json().game.currentTurn).toBe('USER');
    expect(current.json().game.storyThreadSummary.currentPhase).toBeTruthy();
    expect(current.json().game.storyThreadSummary.carryForward).toBeTruthy();
  });

  it('should reject login with wrong password', async () => {
    const response = await app.inject({
      method: 'POST',
      url: '/api/auth/login',
      payload: { username: 'demo', password: 'wrong-password' },
    });

    expect(response.statusCode).toBe(401);
    expect(response.json().error.code).toBe('AUTH_INVALID');
  });

  it('should allow admin to create a managed user', async () => {
    const response = await app.inject({
      method: 'POST',
      url: '/api/admin/users',
      headers: { authorization: `Bearer ${adminToken}` },
      payload: { username: 'player-a', password: 'secure123', role: 'USER' },
    });

    expect(response.statusCode).toBe(201);
    expect(response.json().user.username).toBe('player-a');
  });

  it('should update and persist theme preferences', async () => {
    const response = await app.inject({
      method: 'PATCH',
      url: '/api/auth/preferences',
      headers: {
        authorization: `Bearer ${demoToken}`,
        'content-type': 'application/json',
      },
      payload: { theme: 'ink' },
    });

    expect(response.statusCode).toBe(200);
    expect(response.json().preferences.theme).toBe('ink');

    const storedPreference = await prisma.userPreference.findUniqueOrThrow({ where: { userId: demoUserId } });
    expect(storedPreference.theme).toBe('ink');
  });

  it('should enforce one ongoing game per user', async () => {
    await prisma.gameSession.create({
      data: {
        userId: demoUserId,
        difficulty: 'BEGINNER',
        status: 'ONGOING',
        initialFen: 'initial-fen',
        currentFen: 'initial-fen',
      },
    });

    const response = await app.inject({
      method: 'POST',
      url: '/api/games',
      headers: { authorization: `Bearer ${demoToken}` },
      payload: { difficulty: 'MASTER' },
    });

    expect(response.statusCode).toBe(409);
    expect(response.json().error.code).toBe('GAME_ALREADY_ONGOING');
  });

  it('should apply a legal user move and then let AI answer with a legal move', async () => {
    const createdGame = await createGame();
    const userMove = rules.getLegalMoves(createdGame.currentFen)[0];
    expect(userMove).toBeTruthy();

    const response = await app.inject({
      method: 'POST',
      url: `/api/games/${createdGame.id}/moves`,
      headers: { authorization: `Bearer ${demoToken}` },
      payload: { from: userMove.from, to: userMove.to },
    });

    expect(response.statusCode).toBe(200);
    expect(response.json().userMove.from).toBe(userMove.from);
    expect(response.json().aiMove).toBeTruthy();
    expect(response.json().game.currentFen).not.toBe(createdGame.currentFen);
    expect(response.json().game.canUndo).toBe(true);

    const storedGame = await prisma.gameSession.findUniqueOrThrow({ where: { id: createdGame.id } });
    const history = JSON.parse(storedGame.moveHistory) as Array<{ actor: string; from: string; to: string; fenBefore: string }>;
    expect(history).toHaveLength(2);
    expect(history[0].actor).toBe('USER');
    expect(history[1].actor).toBe('AI');
    expect(rules.validateMove(history[1].fenBefore, { from: history[1].from, to: history[1].to }).ok).toBe(true);
  });

  it('should reject illegal moves without polluting game state', async () => {
    const createdGame = await createGame();

    const response = await app.inject({
      method: 'POST',
      url: `/api/games/${createdGame.id}/moves`,
      headers: { authorization: `Bearer ${demoToken}` },
      payload: { from: 'a1', to: 'a4' },
    });

    expect(response.statusCode).toBe(422);
    expect(response.json().error.code).toBe('ILLEGAL_MOVE');

    const storedGame = await prisma.gameSession.findUniqueOrThrow({ where: { id: createdGame.id } });
    expect(storedGame.currentFen).toBe(createdGame.currentFen);
    expect(JSON.parse(storedGame.moveHistory)).toEqual([]);
    expect(storedGame.status).toBe('ONGOING');
  });

  it('should support undo for the latest full round and block consecutive undo', async () => {
    const createdGame = await createGame();
    const userMove = rules.getLegalMoves(createdGame.currentFen)[0];

    await app.inject({
      method: 'POST',
      url: `/api/games/${createdGame.id}/moves`,
      headers: { authorization: `Bearer ${demoToken}` },
      payload: { from: userMove.from, to: userMove.to },
    });

    const undo = await app.inject({
      method: 'POST',
      url: `/api/games/${createdGame.id}/undo`,
      headers: { authorization: `Bearer ${demoToken}` },
    });

    expect(undo.statusCode).toBe(200);
    expect(undo.json().game.currentFen).toBe(createdGame.currentFen);
    expect(undo.json().game.undoCount).toBe(1);
    expect(undo.json().game.canUndo).toBe(false);

    const secondUndo = await app.inject({
      method: 'POST',
      url: `/api/games/${createdGame.id}/undo`,
      headers: { authorization: `Bearer ${demoToken}` },
    });

    expect(secondUndo.statusCode).toBe(409);
    expect(secondUndo.json().error.code).toBe('GAME_UNDO_NOT_AVAILABLE');
  });

  it('should allow resign and clear current ongoing game lookup', async () => {
    const createdGame = await createGame();

    const resign = await app.inject({
      method: 'POST',
      url: `/api/games/${createdGame.id}/resign`,
      headers: { authorization: `Bearer ${demoToken}` },
    });

    expect(resign.statusCode).toBe(200);
    expect(resign.json().game.status).toBe('RESIGNED');
    expect(resign.json().game.endedByResign).toBe(true);

    const current = await app.inject({
      method: 'GET',
      url: '/api/games/current',
      headers: { authorization: `Bearer ${demoToken}` },
    });

    expect(current.statusCode).toBe(200);
    expect(current.json().game).toBeNull();
  });

  it('should keep AI replies legal across multiple rounds', async () => {
    const createdGame = await createGame();
    let currentFen = createdGame.currentFen;

    for (let round = 0; round < 4; round += 1) {
      const legalUserMove = rules.getLegalMoves(currentFen)[0];
      expect(legalUserMove).toBeTruthy();

      const response = await app.inject({
        method: 'POST',
        url: `/api/games/${createdGame.id}/moves`,
        headers: { authorization: `Bearer ${demoToken}` },
        payload: { from: legalUserMove.from, to: legalUserMove.to },
      });

      expect(response.statusCode).toBe(200);
      const storedGame = await prisma.gameSession.findUniqueOrThrow({ where: { id: createdGame.id } });
      const history = JSON.parse(storedGame.moveHistory) as Array<{ actor: string; from: string; to: string; fenBefore: string }>;
      const aiMove = history.at(-1);
      expect(aiMove?.actor).toBe('AI');
      expect(rules.validateMove(aiMove!.fenBefore, { from: aiMove!.from, to: aiMove!.to }).ok).toBe(true);

      currentFen = storedGame.currentFen;
      if (storedGame.status !== 'ONGOING') {
        break;
      }
    }
  });
});
