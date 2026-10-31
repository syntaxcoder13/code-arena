import { execFileSync } from 'node:child_process';
import { randomUUID } from 'node:crypto';
import { beforeAll, afterAll, describe, expect, it } from 'vitest';
import { NotFoundException } from '@nestjs/common';
import { PrismaClient } from '@prisma/client';
import type { PrismaService } from '../../src/database/prisma.service';
import { BattleService } from '../../src/modules/battles/battle.service';
import { ResultsService } from '../../src/modules/battles/results.service';
import { SubmissionService } from '../../src/modules/battles/submission.service';

const url = process.env.TEST_DATABASE_URL;

describe.skipIf(!url)('concurrent battle reads on PostgreSQL', () => {
  let db: PrismaClient;
  let battles: BattleService;
  let results: ResultsService;
  let submissions: SubmissionService;
  const player = randomUUID();
  const opponent = randomUUID();
  const battleId = randomUUID();
  const problemId = randomUUID();

  beforeAll(async () => {
    // Never fall back to DATABASE_URL or migrate an arbitrary database.
    const parsed = new URL(url!);
    if (!['localhost', '127.0.0.1'].includes(parsed.hostname) || parsed.pathname !== '/opensourcehub_test') {
      throw new Error('TEST_DATABASE_URL must name the isolated local opensourcehub_test database');
    }
    execFileSync(process.execPath, ['node_modules/prisma/build/index.js', 'migrate', 'deploy'], {
      env: { ...process.env, DATABASE_URL: url! }, stdio: 'pipe', timeout: 30000,
    });
    db = new PrismaClient({ datasourceUrl: url });
    const prisma = db as PrismaService;
    battles = new BattleService(prisma, {} as never, {} as never);
    results = new ResultsService(prisma);
    submissions = new SubmissionService(prisma, {} as never, {} as never);
    await db.user.createMany({ data: [player, opponent].map(id => ({ id, githubId: id, username: id })) });
    await db.problem.create({ data: { id: problemId, slug: problemId, title: 'Fixture', statement: 'Fixture', language: 'javascript', testCases: [] } });
    await db.battle.create({ data: {
      id: battleId, creatorId: player, problemId, difficulty: 'easy', language: 'javascript',
      visibility: 'PRIVATE', state: 'COMPLETE', finalPlayerCount: 2,
      capacity: 2, durationSeconds: 1800, lobbyExpiresAt: new Date(), completedAt: new Date(),
      participants: { create: [player, opponent].map((userId, index) => ({
        userId, state: 'SUBMITTED', rank: index + 1,
        submission: { create: { language: 'javascript', code: userId === player ? 'my draft' : 'private opponent draft' } },
      })) },
    } });
  }, 45000);

  afterAll(async () => {
    if (!db) return;
    try {
      await db.user.deleteMany({ where: { id: { in: [player, opponent] } } });
      await db.problem.deleteMany({ where: { id: problemId } });
    } finally { await db.$disconnect(); }
  });

  it('survives overlapping lobby, result and draft polls without engine batching panics', async () => {
    // Two same-tick findUnique reads with explicit relationLoadStrategy:'join'
    // reproduce the Prisma 6.4.1 query_document/mod.rs:280 panic. Exercise real
    // service calls and real engine/SQL, including overlapping query shapes.
    const reads = await Promise.all(Array.from({ length: 16 }, async () => {
      const [battle, result, draft] = await Promise.all([
        battles.getBattle(battleId, player), results.getResults(battleId, player),
        submissions.getDraft(battleId, player),
      ]);
      expect(battle.participants).toHaveLength(2);
      expect(result.standings).toHaveLength(2);
      expect(draft.code).toBe('my draft');
      expect(JSON.stringify(draft)).not.toContain('private opponent draft');
      return battle.id;
    }));
    expect(reads).toEqual(Array(16).fill(battleId));
  }, 30000);

  it('still hides private battles, results and drafts from outsiders under concurrency', async () => {
    await Promise.all(Array.from({ length: 4 }, async () => {
      await expect(battles.getBattle(battleId, 'stranger')).rejects.toBeInstanceOf(NotFoundException);
      await expect(results.getResults(battleId, 'stranger')).rejects.toBeInstanceOf(NotFoundException);
      await expect(submissions.getDraft(battleId, 'stranger')).rejects.toBeInstanceOf(NotFoundException);
    }));
  });
});
