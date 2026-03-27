import { beforeAll, beforeEach, describe, expect, it } from 'vitest';
import { PrismaClient } from '@prisma/client';
import bcrypt from 'bcryptjs';
import { buildApp } from '../../apps/server/src/app.js';

const prisma = new PrismaClient();
const app = buildApp({ prisma });

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
    update: { maxOngoingGamesPerUser: 1 },
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
  it('should login and read current user profile', async () => {
    const me = await app.inject({
      method: 'GET',
      url: '/api/auth/me',
      headers: { authorization: `Bearer ${demoToken}` },
    });

    expect(me.statusCode).toBe(200);
    expect(me.json().user.username).toBe('demo');
  });

  it('should create a game and then read current ongoing game', async () => {
    const create = await app.inject({
      method: 'POST',
      url: '/api/games',
      headers: { authorization: `Bearer ${demoToken}` },
      payload: { difficulty: 'NORMAL' },
    });

    expect(create.statusCode).toBe(201);
    expect(create.json().game.status).toBe('ONGOING');

    const current = await app.inject({
      method: 'GET',
      url: '/api/games/current',
      headers: { authorization: `Bearer ${demoToken}` },
    });

    expect(current.statusCode).toBe(200);
    expect(current.json().game.id).toBe(create.json().game.id);
    expect(current.json().game.currentFen).toBeTruthy();
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
});
