import { beforeAll, beforeEach, describe, expect, it, vi } from 'vitest';
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
  await prisma.modelConfig.deleteMany();
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
  await prisma.modelConfig.create({
    data: {
      configKey: 'decision',
      modelName: 'demo-decision',
      baseUrl: 'https://api.example.com/v1',
      apiKeyMaskedHint: 'sk-d***1234',
      thinkingLevel: 'normal',
      enabled: true,
      createdById: admin.id,
      updatedById: admin.id,
    },
  });

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



  it('should use decision provider move when provider returns a legal move', async () => {
    const previousDecisionKey = process.env.DECISION_API_KEY;
    process.env.DECISION_API_KEY = 'sk-test-decision-key';

    const createdGame = await createGame();
    const userMove = rules.getLegalMoves(createdGame.currentFen)[0];
    expect(userMove).toBeTruthy();

    const afterUserMove = rules.applyMove(createdGame.currentFen, { from: userMove.from, to: userMove.to });
    expect(afterUserMove.ok).toBe(true);
    if (!afterUserMove.ok) {
      throw new Error('expected legal user move');
    }

    const providerMove = rules.getLegalMoves(afterUserMove.nextFen)[1] ?? rules.getLegalMoves(afterUserMove.nextFen)[0];
    expect(providerMove).toBeTruthy();

    const originalFetch = globalThis.fetch;
    const fetchMock = vi.fn(async (input: RequestInfo | URL, init?: RequestInit) => {
      const url = typeof input === 'string'
        ? input
        : input instanceof URL
          ? input.toString()
          : input.url;

      if (url.includes('/responses')) {
        return new Response([
          'data: ' + JSON.stringify({ type: 'response.created' }),
          'data: ' + JSON.stringify({ type: 'response.output_text.delta', delta: '{"move":{"from":"' + providerMove.from + '","to":"' + providerMove.to + '"},"reason":"优先抢中路节拍。"}' }),
          'data: ' + JSON.stringify({
            type: 'response.completed',
            response: {
              id: 'resp_test_decision_ok',
              status: 'completed',
              output: [],
              output_text: '',
            },
          }),
          'data: [DONE]',
          '',
        ].join('\n'), {
          status: 200,
          headers: { 'content-type': 'text/event-stream' },
        }) as Response;
      }

      if (url.includes('/v1/chat/completions')) {
        return new Response(JSON.stringify({
          choices: [
            {
              message: {
                content: JSON.stringify({
                  move: {
                    from: providerMove.from,
                    to: providerMove.to,
                  },
                  reason: '优先抢中路节拍。',
                }),
              },
            },
          ],
        }), {
          status: 200,
          headers: { 'content-type': 'application/json' },
        }) as Response;
      }

      return originalFetch(input as any, init);
    });

    globalThis.fetch = fetchMock as typeof fetch;

    try {
      const response = await app.inject({
        method: 'POST',
        url: `/api/games/${createdGame.id}/moves`,
        headers: { authorization: `Bearer ${demoToken}` },
        payload: { from: userMove.from, to: userMove.to },
      });

      expect(response.statusCode).toBe(200);
      expect(response.json().aiMove.from).toBe(providerMove.from);
      expect(response.json().aiMove.to).toBe(providerMove.to);
      expect(response.json().aiMove.decision.situationShift).toContain('优先抢中路节拍');
      expect(fetchMock).toHaveBeenCalled();
    } finally {
      globalThis.fetch = originalFetch;
      if (previousDecisionKey === undefined) {
        delete process.env.DECISION_API_KEY;
      } else {
        process.env.DECISION_API_KEY = previousDecisionKey;
      }
    }
  });

  it('should send structured decision contract payload to provider', async () => {
    const previousDecisionKey = process.env.DECISION_API_KEY;
    process.env.DECISION_API_KEY = 'sk-test-decision-key';

    const createdGame = await createGame();
    const userMove = rules.getLegalMoves(createdGame.currentFen)[0];
    expect(userMove).toBeTruthy();

    const afterUserMove = rules.applyMove(createdGame.currentFen, { from: userMove.from, to: userMove.to });
    expect(afterUserMove.ok).toBe(true);
    if (!afterUserMove.ok) {
      throw new Error('expected legal user move');
    }

    const providerMove = rules.getLegalMoves(afterUserMove.nextFen)[0];
    expect(providerMove).toBeTruthy();

    const originalFetch = globalThis.fetch;
    let capturedBody: any = null;
    globalThis.fetch = vi.fn(async (input: RequestInfo | URL, init?: RequestInit) => {
      const url = typeof input === 'string'
        ? input
        : input instanceof URL
          ? input.toString()
          : input.url;

      if (url.includes('/v1/chat/completions')) {
        capturedBody = JSON.parse(String(init?.body ?? '{}'));
        return new Response(JSON.stringify({
          choices: [
            {
              message: {
                content: JSON.stringify({
                  move: {
                    from: providerMove.from,
                    to: providerMove.to,
                  },
                  reason: '先把中路节拍稳住。',
                }),
              },
            },
          ],
        }), {
          status: 200,
          headers: { 'content-type': 'application/json' },
        }) as Response;
      }

      return originalFetch(input as any, init);
    }) as typeof fetch;

    try {
      const response = await app.inject({
        method: 'POST',
        url: `/api/games/${createdGame.id}/moves`,
        headers: { authorization: `Bearer ${demoToken}` },
        payload: { from: userMove.from, to: userMove.to },
      });

      expect(response.statusCode).toBe(200);
      expect(capturedBody).toBeTruthy();
      expect(capturedBody.messages).toHaveLength(2);

      const userPayload = JSON.parse(capturedBody.messages[1].content);
      expect(userPayload.inputContract.version).toBe('d2.6');
      expect(userPayload.inputContract.requiredReadOrder).toEqual(['positionState', 'userMove', 'legalMoveDigest', 'priorityCandidates', 'legalMoves', 'recentHistory']);
      expect(userPayload.positionState.legalMoveCount).toBe(userPayload.legalMoveCount);
      expect(userPayload.positionState.nextTurn).toBe('b');
      expect(userPayload.difficultyGuide).toBeTruthy();
      expect(userPayload.legalMoveDigest.total).toBe(userPayload.legalMoveCount);
      expect(userPayload.legalMoveDigest.byPiece).toBeTruthy();
      expect(Array.isArray(userPayload.priorityCandidates)).toBe(true);
      expect(userPayload.priorityCandidates.length).toBeGreaterThan(0);
      expect(userPayload.priorityCandidates.length).toBeLessThanOrEqual(8);
      expect(userPayload.priorityCandidates[0]).toHaveProperty('tacticalTag');
      expect(userPayload.priorityCandidates[0]).toHaveProperty('why');
      expect(userPayload.inputContract.noiseControl.legalMovesFields).toEqual(['from', 'to']);
      expect(userPayload.inputContract.noiseControl.priorityCandidatesMaxCount).toBe(8);
      expect(userPayload.legalMoves.length).toBe(userPayload.legalMoveCount);
      expect(Object.keys(userPayload.legalMoves[0]).sort()).toEqual(['from', 'to']);
      expect(Array.isArray(userPayload.legalMoveDigest.captureMoveSamples)).toBe(true);
      expect(Array.isArray(userPayload.legalMoveDigest.checkMoveSamples)).toBe(true);
      expect(Array.isArray(userPayload.legalMoveDigest.centralControlSamples)).toBe(true);
    } finally {
      globalThis.fetch = originalFetch;
      if (previousDecisionKey === undefined) {
        delete process.env.DECISION_API_KEY;
      } else {
        process.env.DECISION_API_KEY = previousDecisionKey;
      }
    }
  });

  it('should send structured decision contract payload to responses provider', async () => {
    const previousDecisionKey = process.env.DECISION_API_KEY;
    process.env.DECISION_API_KEY = 'sk-test-decision-key';

    await prisma.modelConfig.update({
      where: { configKey: 'decision' },
      data: {
        modelName: 'gpt-5.4',
        baseUrl: 'https://codex.hiyo.top/v1',
        enabled: true,
      },
    });

    const createdGame = await createGame();
    const userMove = rules.getLegalMoves(createdGame.currentFen)[0];
    expect(userMove).toBeTruthy();

    const afterUserMove = rules.applyMove(createdGame.currentFen, { from: userMove.from, to: userMove.to });
    expect(afterUserMove.ok).toBe(true);
    if (!afterUserMove.ok) {
      throw new Error('expected legal user move');
    }

    const providerMove = rules.getLegalMoves(afterUserMove.nextFen)[0];
    expect(providerMove).toBeTruthy();

    const originalFetch = globalThis.fetch;
    let capturedBody: any = null;
    globalThis.fetch = vi.fn(async (input: RequestInfo | URL, init?: RequestInit) => {
      const url = typeof input === 'string'
        ? input
        : input instanceof URL
          ? input.toString()
          : input.url;

      if (url.includes('/responses')) {
        capturedBody = JSON.parse(String(init?.body ?? '{}'));
        return new Response([
          'data: ' + JSON.stringify({ type: 'response.created' }),
          'data: ' + JSON.stringify({ type: 'response.output_text.delta', delta: '{"move":{"from":"' + providerMove.from + '","to":"' + providerMove.to + '"},"reason":"先把中路节拍稳住。"}' }),
          'data: ' + JSON.stringify({
            type: 'response.completed',
            response: {
              id: 'resp_test_decision_structured_payload',
              status: 'completed',
              output: [],
              output_text: '',
            },
          }),
          'data: [DONE]',
          '',
        ].join('\n'), {
          status: 200,
          headers: { 'content-type': 'text/event-stream' },
        }) as Response;
      }

      return originalFetch(input as any, init);
    }) as typeof fetch;

    try {
      const response = await app.inject({
        method: 'POST',
        url: `/api/games/${createdGame.id}/moves`,
        headers: { authorization: `Bearer ${demoToken}` },
        payload: { from: userMove.from, to: userMove.to },
      });

      expect(response.statusCode).toBe(200);
      expect(capturedBody).toBeTruthy();
      expect(capturedBody.model).toBe('gpt-5.4');
      expect(capturedBody.instructions).toContain('priorityCandidates');
      expect(capturedBody.stream).toBe(true);

      const userPayload = JSON.parse(capturedBody.input[0].content);
      expect(userPayload.inputContract.version).toBe('d2.6');
      expect(userPayload.inputContract.requiredReadOrder).toEqual(['positionState', 'userMove', 'legalMoveDigest', 'priorityCandidates', 'legalMoves', 'recentHistory']);
      expect(userPayload.inputContract.noiseControl.legalMovesFields).toEqual(['from', 'to']);
      expect(userPayload.inputContract.reasonConstraints.focusTags).toEqual(['压迫', '解围', '抢位', '换子', '收束', '稳阵', '试探']);
      expect(Array.isArray(userPayload.priorityCandidates)).toBe(true);
      expect(userPayload.priorityCandidates.length).toBeGreaterThan(0);
      expect(Object.keys(userPayload.legalMoves[0]).sort()).toEqual(['from', 'to']);
    } finally {
      globalThis.fetch = originalFetch;
      if (previousDecisionKey === undefined) {
        delete process.env.DECISION_API_KEY;
      } else {
        process.env.DECISION_API_KEY = previousDecisionKey;
      }
    }
  });

  it('should use fallback situation shift when provider reason is too generic', async () => {
    const previousDecisionKey = process.env.DECISION_API_KEY;
    process.env.DECISION_API_KEY = 'sk-test-decision-key';

    const createdGame = await createGame();
    const userMove = rules.getLegalMoves(createdGame.currentFen)[0];
    expect(userMove).toBeTruthy();

    const afterUserMove = rules.applyMove(createdGame.currentFen, { from: userMove.from, to: userMove.to });
    expect(afterUserMove.ok).toBe(true);
    if (!afterUserMove.ok) {
      throw new Error('expected legal user move');
    }

    const providerMove = rules.getLegalMoves(afterUserMove.nextFen)[1] ?? rules.getLegalMoves(afterUserMove.nextFen)[0];
    expect(providerMove).toBeTruthy();

    const originalFetch = globalThis.fetch;
    globalThis.fetch = vi.fn(async (input: RequestInfo | URL, init?: RequestInit) => {
      const url = typeof input === 'string'
        ? input
        : input instanceof URL
          ? input.toString()
          : input.url;

      if (url.includes('/responses')) {
        return new Response([
          'data: ' + JSON.stringify({ type: 'response.created' }),
          'data: ' + JSON.stringify({ type: 'response.output_text.delta', delta: '{"move":{"from":"' + providerMove.from + '","to":"' + providerMove.to + '"},"reason":"综合来看，这样可以更好地推进后续局面。"}' }),
          'data: ' + JSON.stringify({
            type: 'response.completed',
            response: {
              id: 'resp_test_decision_generic_reason',
              status: 'completed',
              output: [],
              output_text: '',
            },
          }),
          'data: [DONE]',
          '',
        ].join('\n'), {
          status: 200,
          headers: { 'content-type': 'text/event-stream' },
        }) as Response;
      }

      if (url.includes('/v1/chat/completions')) {
        return new Response(JSON.stringify({
          choices: [
            {
              message: {
                content: JSON.stringify({
                  move: {
                    from: providerMove.from,
                    to: providerMove.to,
                  },
                  reason: '综合来看，这样可以更好地推进后续局面。',
                }),
              },
            },
          ],
        }), {
          status: 200,
          headers: { 'content-type': 'application/json' },
        }) as Response;
      }

      return originalFetch(input as any, init);
    }) as typeof fetch;

    try {
      const response = await app.inject({
        method: 'POST',
        url: `/api/games/${createdGame.id}/moves`,
        headers: { authorization: `Bearer ${demoToken}` },
        payload: { from: userMove.from, to: userMove.to },
      });

      expect(response.statusCode).toBe(200);
      expect(response.json().aiMove.from).toBe(providerMove.from);
      expect(response.json().aiMove.to).toBe(providerMove.to);
      expect(response.json().aiMove.decision.situationShift).not.toContain('综合来看');
      expect(response.json().aiMove.decision.situationShift).not.toContain('这样可以更好地推进后续局面');
      expect(response.json().aiMove.decision.situationShift).toBeTruthy();
    } finally {
      globalThis.fetch = originalFetch;
      if (previousDecisionKey === undefined) {
        delete process.env.DECISION_API_KEY;
      } else {
        process.env.DECISION_API_KEY = previousDecisionKey;
      }
    }
  });

  it('should fallback to local decision engine when provider returns an illegal move', async () => {
    const previousDecisionKey = process.env.DECISION_API_KEY;
    process.env.DECISION_API_KEY = 'sk-test-decision-key';

    const createdGame = await createGame();
    const userMove = rules.getLegalMoves(createdGame.currentFen)[0];
    expect(userMove).toBeTruthy();

    const originalFetch = globalThis.fetch;
    globalThis.fetch = vi.fn(async (input: RequestInfo | URL, init?: RequestInit) => {
      const url = typeof input === 'string'
        ? input
        : input instanceof URL
          ? input.toString()
          : input.url;

      if (url.includes('/responses')) {
        return new Response([
          'data: ' + JSON.stringify({ type: 'response.created' }),
          'data: ' + JSON.stringify({ type: 'response.output_text.delta', delta: '{"move":{"from":"a0","to":"a9"},"reason":"故意返回非法步。"}' }),
          'data: ' + JSON.stringify({
            type: 'response.completed',
            response: {
              id: 'resp_test_decision_bad',
              status: 'completed',
              output: [],
              output_text: '',
            },
          }),
          'data: [DONE]',
          '',
        ].join('\n'), {
          status: 200,
          headers: { 'content-type': 'text/event-stream' },
        }) as Response;
      }

      if (url.includes('/v1/chat/completions')) {
        return new Response(JSON.stringify({
          choices: [
            {
              message: {
                content: JSON.stringify({
                  move: {
                    from: 'a0',
                    to: 'a9',
                  },
                  reason: '故意返回非法步。',
                }),
              },
            },
          ],
        }), {
          status: 200,
          headers: { 'content-type': 'application/json' },
        }) as Response;
      }

      return originalFetch(input as any, init);
    }) as typeof fetch;

    try {
      const response = await app.inject({
        method: 'POST',
        url: `/api/games/${createdGame.id}/moves`,
        headers: { authorization: `Bearer ${demoToken}` },
        payload: { from: userMove.from, to: userMove.to },
      });

      expect(response.statusCode).toBe(200);
      expect(response.json().aiMove).toBeTruthy();
      const userApplied = rules.applyMove(createdGame.currentFen, { from: userMove.from, to: userMove.to });
      expect(userApplied.ok).toBe(true);
      if (!userApplied.ok) {
        throw new Error('expected legal user move');
      }
      expect(rules.validateMove(userApplied.nextFen, { from: response.json().aiMove.from, to: response.json().aiMove.to }).ok).toBe(true);
      expect(response.json().aiMove.decision).toBeTruthy();
    } finally {
      globalThis.fetch = originalFetch;
      if (previousDecisionKey === undefined) {
        delete process.env.DECISION_API_KEY;
      } else {
        process.env.DECISION_API_KEY = previousDecisionKey;
      }
    }
  });

  it('should resolve narrative route from provider with compact response shape', async () => {
    const previousNarrativeKey = process.env.NARRATIVE_API_KEY;
    process.env.NARRATIVE_API_KEY = 'sk-test-narrative-key';

    await prisma.modelConfig.create({
      data: {
        configKey: 'narrative',
        modelName: 'gpt-5.4',
        baseUrl: 'https://codex.hiyo.top/v1',
        apiKeyMaskedHint: 'sk-t***key',
        thinkingLevel: 'normal',
        enabled: true,
      },
    });

    const originalFetch = globalThis.fetch;
    const fetchMock = vi.fn(async (input: RequestInfo | URL, init?: RequestInit) => {
      const url = typeof input === 'string'
        ? input
        : input instanceof URL
          ? input.toString()
          : input.url;

      if (url.includes('/v1/chat/completions')) {
        return new Response(JSON.stringify({
          choices: [
            {
              message: {
                content: JSON.stringify({
                  itemType: 'turn',
                  title: '中线先试一手',
                  summary: '兵卒对提，中线节拍被同时抬起，局面仍在试探，尚未转成实压。',
                  review: '红兵进一，黑卒亦进一，中线形成对位，双方都在试探。',
                  voices: '车：先占节拍。马：都没露急手。炮：中路先亮了。',
                  consensus: '这一回合没有交换与将压，只是把中路起势摆明。',
                  decision: '试探已落子，接下来就看谁先把中线节拍转成实压。',
                  tone: 'calm',
                  highlightLevel: 'medium',
                  displayHints: { theme: 'classic', preferredLayout: 'compact' },
                }),
              },
            },
          ],
        }), {
          status: 200,
          headers: { 'content-type': 'application/json' },
        }) as Response;
      }

      return originalFetch(input as any, init);
    });

    globalThis.fetch = fetchMock as typeof fetch;

    try {
      const response = await app.inject({
        method: 'POST',
        url: '/api/narrative/resolve',
        headers: {
          'content-type': 'application/json',
        },
        payload: {
          theme: 'classic',
          envelope: {
            schemaVersion: 'v1',
            requestId: 'test-narrative-route-001',
            gameContext: {
              gameId: 'game-1',
              turnNumber: 1,
              userSide: 'red',
              aiSide: 'black',
              difficulty: 'NORMAL',
              gameStatus: 'ONGOING',
              isCheck: false,
              isGameEnding: false,
              storyThreadSummary: {
                currentPhase: '对压期',
                mainConflict: '双方都在争谁能先把试探落成实压，黑方当前更占话语权。',
                pressureSide: 'BLACK',
                recentFocus: '中路压力',
                carryForward: '下一回合继续强调红方先解压，再谈反抢。',
              },
            },
            themeContext: {
              storyThemeId: 'border-council-night',
              storyThemeName: '边关夜议',
              themeTone: '稳中见锋',
              doNotUseStyles: ['长篇抒情', '过度比喻', '强表演台词'],
            },
            roleContext: {
              activeRoles: ['车', '马', '炮'],
              roleCardsVersion: 'v1',
              roleHints: ['车：发言要短，要贴住当前局势。', '马：发言要短，要贴住当前局势。', '炮：发言要短，要贴住当前局势。'],
            },
            itemType: 'turn',
            itemPayload: {
              turnNumber: 1,
              userMove: { from: 'e3', to: 'e4', pieceType: '兵', semanticTag: '试探' },
              aiMove: { from: 'e7', to: 'e6', pieceType: '卒', semanticTag: '试探' },
              capture: false,
              checkState: { before: false, after: false },
              situationShift: '双方先把中路节拍抬起来。',
              turnArc: '试探铺垫',
              highlightReason: ['中线对位'],
              storyThreadSummary: {
                currentPhase: '对压期',
                mainConflict: '双方都在争谁能先把试探落成实压，黑方当前更占话语权。',
                pressureSide: 'BLACK',
                recentFocus: '中路压力',
                carryForward: '下一回合继续强调红方先解压，再谈反抢。',
              },
              narrativeGoal: '解释这一回合在剧情上的推进意义，并保持角色发言克制短促。',
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
              timeoutMs: 15000,
              onSchemaInvalid: 'fallback',
              onEmptyResponse: 'fallback',
            },
          },
        },
      });

      expect(response.statusCode).toBe(200);
      expect(response.json().source).toBe('provider');
      expect(response.json().fallbackUsed).toBe(false);
      expect(response.json().response.segments.map((segment: { kind: string }) => segment.kind)).toEqual(['review', 'voices', 'consensus', 'decision']);
      expect(fetchMock).toHaveBeenCalled();
    } finally {
      globalThis.fetch = originalFetch;
      if (previousNarrativeKey === undefined) {
        delete process.env.NARRATIVE_API_KEY;
      } else {
        process.env.NARRATIVE_API_KEY = previousNarrativeKey;
      }
    }
  });

  it('should parse SSE chat completion chunks and return provider narrative', async () => {
    const previousNarrativeKey = process.env.NARRATIVE_API_KEY;
    process.env.NARRATIVE_API_KEY = 'sk-live-test-sse';

    await prisma.modelConfig.upsert({
      where: { configKey: 'narrative' },
      update: {
        modelName: 'gpt-5.4',
        baseUrl: 'https://api.example.com/v1',
        apiKeyMaskedHint: 'sk-l***sse',
        enabled: true,
      },
      create: {
        configKey: 'narrative',
        modelName: 'gpt-5.4',
        baseUrl: 'https://api.example.com/v1',
        apiKeyMaskedHint: 'sk-l***sse',
        thinkingLevel: 'high',
        enabled: true,
      },
    });

    const originalFetch = globalThis.fetch;
    const sseEvents = [
      {
        id: 'resp_sse_1',
        object: 'chat.completion.chunk',
        created: 1,
        model: 'gpt-5.4',
        choices: [{ index: 0, delta: { role: 'assistant' }, finish_reason: null }],
      },
      {
        id: 'resp_sse_1',
        object: 'chat.completion.chunk',
        created: 1,
        model: 'gpt-5.4',
        choices: [{
          index: 0,
          delta: {
            content: JSON.stringify({
              schemaVersion: 'v1',
              itemType: 'turn',
              title: '第 1 回合',
              summary: '双方先把中路节拍抬起来。',
              tone: 'calm',
              highlightLevel: 'medium',
              segments: [
                { kind: 'review', label: '简评', text: '双方先把中路节拍抬起来。' },
                { kind: 'voices', label: '发言', text: '车：先把这条线看稳。' },
                { kind: 'consensus', label: '共识', text: '当前共识：先稳住中路。' },
                { kind: 'decision', label: '落子', text: '兵 e3→e4；卒 e7→e6。' },
              ],
              displayHints: {},
            }),
          },
          finish_reason: null,
        }],
      },
      {
        id: 'resp_sse_1',
        object: 'chat.completion.chunk',
        created: 1,
        model: 'gpt-5.4',
        choices: [{ index: 0, delta: { content: '' }, finish_reason: 'stop' }],
      },
    ];

    const sseBody = `${sseEvents.map((event) => `data: ${JSON.stringify(event)}`).join('\n\n')}\n\ndata: [DONE]\n\n`;

    globalThis.fetch = vi.fn(async () => new Response(sseBody, {
      status: 200,
      headers: { 'content-type': 'text/event-stream' },
    })) as typeof fetch;

    try {
      const response = await app.inject({
        method: 'POST',
        url: '/api/narrative/resolve',
        headers: {
          'content-type': 'application/json',
        },
        payload: {
          theme: 'classic',
          envelope: {
            schemaVersion: 'v1',
            requestId: 'test-narrative-sse-001',
            gameContext: {
              gameId: 'game-1',
              turnNumber: 1,
              userSide: 'red',
              aiSide: 'black',
              difficulty: 'NORMAL',
              gameStatus: 'ONGOING',
              isCheck: false,
              isGameEnding: false,
              storyThreadSummary: {
                currentPhase: '对压期',
                mainConflict: '双方都在争谁能先把试探落成实压。',
                pressureSide: 'BALANCED',
                recentFocus: '中路压力',
                carryForward: '下一回合继续强调红方先解压。',
              },
            },
            themeContext: {
              storyThemeId: 'border-council-night',
              storyThemeName: '边关夜议',
              themeTone: '稳中见锋',
              doNotUseStyles: ['长篇抒情'],
            },
            roleContext: {
              activeRoles: ['车', '马', '炮'],
              roleCardsVersion: 'v1',
              roleHints: ['车：发言要短。'],
            },
            itemType: 'turn',
            itemPayload: {
              turnNumber: 1,
              userMove: { from: 'e3', to: 'e4', pieceType: '兵', semanticTag: '试探' },
              aiMove: { from: 'e7', to: 'e6', pieceType: '卒', semanticTag: '试探' },
              capture: false,
              checkState: { before: false, after: false },
              situationShift: '双方先把中路节拍抬起来。',
              turnArc: '试探铺垫',
              highlightReason: ['中线对位'],
              storyThreadSummary: {
                currentPhase: '对压期',
                mainConflict: '双方都在争谁能先把试探落成实压。',
                pressureSide: 'BALANCED',
                recentFocus: '中路压力',
                carryForward: '下一回合继续强调红方先解压。',
              },
              narrativeGoal: '解释这一回合在剧情上的推进意义。',
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
              timeoutMs: 15000,
              onSchemaInvalid: 'fallback',
              onEmptyResponse: 'fallback',
            },
          },
        },
      });

      expect(response.statusCode).toBe(200);
      expect(response.json().source).toBe('provider');
      expect(response.json().fallbackUsed).toBe(false);
      expect(response.json().response.summary).toContain('双方先把中路节拍抬起来');
      expect(response.json().response.segments.map((segment: { kind: string }) => segment.kind)).toEqual(['review', 'voices', 'consensus', 'decision']);
      expect(globalThis.fetch).toHaveBeenCalled();
    } finally {
      globalThis.fetch = originalFetch;
      if (previousNarrativeKey === undefined) {
        delete process.env.NARRATIVE_API_KEY;
      } else {
        process.env.NARRATIVE_API_KEY = previousNarrativeKey;
      }
    }
  });

  it('should expose runtime model status in auth payloads', async () => {
    const response = await app.inject({
      method: 'GET',
      url: '/api/auth/me',
      headers: { authorization: `Bearer ${demoToken}` },
    });

    expect(response.statusCode).toBe(200);
    expect(response.json().modelRuntimeStatus.hasAnyEnabledModelConfig).toBe(true);
    expect(response.json().modelRuntimeStatus.decisionConfigured).toBe(true);
  });

  it('should allow admin to read and update model configs', async () => {
    const readResponse = await app.inject({
      method: 'GET',
      url: '/api/admin/model-configs',
      headers: { authorization: `Bearer ${adminToken}` },
    });

    expect(readResponse.statusCode).toBe(200);
    expect(readResponse.json().configs).toHaveLength(2);

    const updateResponse = await app.inject({
      method: 'PUT',
      url: '/api/admin/model-configs/narrative',
      headers: {
        authorization: `Bearer ${adminToken}`,
        'content-type': 'application/json',
      },
      payload: {
        modelName: 'demo-narrative',
        baseUrl: 'https://api.example.com/v1',
        apiKey: 'sk-live-narrative-123456',
        thinkingLevel: 'high',
        enabled: true,
      },
    });

    expect(updateResponse.statusCode).toBe(200);
    expect(updateResponse.json().config.configKey).toBe('narrative');
    expect(updateResponse.json().config.enabled).toBe(true);
    expect(updateResponse.json().config.apiKeyMaskedHint).toContain('***');
  });

  it('should block creating a game when no enabled model config exists', async () => {
    await prisma.modelConfig.deleteMany();

    const response = await app.inject({
      method: 'POST',
      url: '/api/games',
      headers: { authorization: `Bearer ${demoToken}` },
      payload: { difficulty: 'NORMAL' },
    });

    expect(response.statusCode).toBe(503);
    expect(response.json().error.code).toBe('MODEL_NOT_CONFIGURED');
  });

  it('should allow admin to read and update runtime policy', async () => {
    const readResponse = await app.inject({
      method: 'GET',
      url: '/api/admin/runtime-policy',
      headers: { authorization: `Bearer ${adminToken}` },
    });

    expect(readResponse.statusCode).toBe(200);
    expect(readResponse.json().runtimePolicy.maxOngoingGamesPerUser).toBe(1);

    const updateResponse = await app.inject({
      method: 'PUT',
      url: '/api/admin/runtime-policy',
      headers: {
        authorization: `Bearer ${adminToken}`,
        'content-type': 'application/json',
      },
      payload: {
        maxConcurrentAiGames: 12,
        maxOngoingGamesPerUser: 2,
        registrationMode: 'INVITE_ONLY',
        maxUndoPerGame: 4,
      },
    });

    expect(updateResponse.statusCode).toBe(200);
    expect(updateResponse.json().runtimePolicy.maxConcurrentAiGames).toBe(12);
    expect(updateResponse.json().runtimePolicy.maxOngoingGamesPerUser).toBe(2);
    expect(updateResponse.json().runtimePolicy.registrationMode).toBe('INVITE_ONLY');
  });

  it('should expose lightweight audit summary for admin operations', async () => {
    await app.inject({
      method: 'PUT',
      url: '/api/admin/runtime-policy',
      headers: {
        authorization: `Bearer ${adminToken}`,
        'content-type': 'application/json',
      },
      payload: {
        maxConcurrentAiGames: 15,
        maxOngoingGamesPerUser: 1,
        registrationMode: 'CLOSED',
        maxUndoPerGame: 5,
      },
    });

    const auditResponse = await app.inject({
      method: 'GET',
      url: '/api/admin/audit-summary?limit=5',
      headers: { authorization: `Bearer ${adminToken}` },
    });

    expect(auditResponse.statusCode).toBe(200);
    expect(auditResponse.json().items.length).toBeGreaterThan(0);
    expect(auditResponse.json().items[0].action).toBeTruthy();
    expect(auditResponse.json().items[0].summary).toBeTruthy();
  });

  it('should apply runtime policy when allowing multiple ongoing games per user', async () => {
    await app.inject({
      method: 'PUT',
      url: '/api/admin/runtime-policy',
      headers: {
        authorization: `Bearer ${adminToken}`,
        'content-type': 'application/json',
      },
      payload: {
        maxConcurrentAiGames: 20,
        maxOngoingGamesPerUser: 2,
        registrationMode: 'CLOSED',
        maxUndoPerGame: 5,
      },
    });

    const firstResponse = await app.inject({
      method: 'POST',
      url: '/api/games',
      headers: { authorization: `Bearer ${demoToken}` },
      payload: { difficulty: 'NORMAL' },
    });

    const secondResponse = await app.inject({
      method: 'POST',
      url: '/api/games',
      headers: { authorization: `Bearer ${demoToken}` },
      payload: { difficulty: 'HARD' },
    });

    expect(firstResponse.statusCode).toBe(201);
    expect(secondResponse.statusCode).toBe(201);
  });

});
