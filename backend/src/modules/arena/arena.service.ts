import { complexityHints } from './complexity';
import { BadRequestException, Inject, Injectable, NotFoundException, ServiceUnavailableException } from '@nestjs/common';

import { Prisma } from '@prisma/client';

import { PrismaService } from '../../database/prisma.service';

import { ProblemService } from '../battles/problem.service';

import { Judge0Client } from '../battles/judge0.client';

import { outputMatches } from '../battles/judge.service';

import { EnforcementService } from '../battles/enforcement.service';

import { BlockService } from '../moderation/block.service';

import { EvaluateDto, SettingsDto } from './arena.dto';

import { STARTERS } from './starters';
import { RedisService } from '../redis/redis.service';
import { EventsService } from '../events/events.service';



export const xpFor = (difficulty: string) => difficulty === 'hard' ? 200 : difficulty === 'medium' ? 125 : 75;

export const tierFor = (rating: number) => rating >= 2400 ? 'GRANDMASTER' : rating >= 2200 ? 'MASTER' : rating >= 2100 ? 'DIAMOND' : rating >= 1800 ? 'PLATINUM' : rating >= 1500 ? 'GOLD' : rating >= 1200 ? 'SILVER' : 'BRONZE';



@Injectable()

export class ArenaService {

  constructor(

    @Inject(PrismaService) private readonly db: PrismaService,

    @Inject(ProblemService) private readonly problems: ProblemService,

    @Inject(Judge0Client) private readonly judge: Judge0Client,

    @Inject(EnforcementService) private readonly enforcement: EnforcementService,

    @Inject(BlockService) private readonly blocks: BlockService,
    @Inject(RedisService) private readonly cache: RedisService,
    @Inject(EventsService) private readonly events: EventsService,

  ) {}

  async recordProgress(battleId: string, userId: string, passed: number, total: number) {
    await this.cache.setJson(`codearena:progress:${battleId}:${userId}`, { userId, passed, total }, 7200);
    await this.events.notify('battle.changed', battleId);
  }
  async progress(battleId: string, userIds: string[]) {
    return (await Promise.all(userIds.map(id => this.cache.getJson<{ userId: string; passed: number; total: number }>(`codearena:progress:${battleId}:${id}`)))).filter(Boolean);
  }



  async joinRoom(userId: string, id: string) {

    await this.enforcement.assertNotBanned(userId);

    const barred = await this.blocks.blockedIds(userId);

    return this.db.$transaction(async tx => {

      // The unguessable room ID is the invitation for a private custom room.

      // Lock before checking capacity so the last seat cannot be sold twice.

      await tx.$queryRaw`SELECT "id" FROM "battles" WHERE "id" = ${id} FOR UPDATE`;

      const room = await tx.battle.findUnique({ where: { id }, include: { participants: true } });

      if (!room || room.visibility === 'GHOST') throw new NotFoundException('Room not found');

      const existing = room.participants.find(p => p.userId === userId);

      if (existing?.state === 'JOINED') return;

      if (!['OPEN', 'INVITED', 'CREATED'].includes(room.state) || room.lobbyExpiresAt.getTime() <= Date.now()) throw new BadRequestException('This room is no longer open');

      const joined = room.participants.filter(p => p.state === 'JOINED');

      if (joined.length >= room.capacity) throw new BadRequestException('Room is full');

      if (joined.some(p => barred.includes(p.userId))) throw new BadRequestException('You cannot join this room');

      await tx.battleParticipant.upsert({ where: { battleId_userId: { battleId: id, userId } }, create: { battleId: id, userId, state: 'JOINED', joinedAt: new Date() }, update: { state: 'JOINED', joinedAt: existing?.joinedAt ?? new Date() } });

    });

  }



  async catalog() {

    // Selecting testCases is confined to getForPlayer, which removes hidden cases.

    const rows = await this.db.problem.findMany({ where: { reviewed: true }, select: { id: true }, orderBy: { title: 'asc' } });

    const problems = await Promise.all(rows.map(row => this.problems.getForPlayer(row.id)));

    return problems.map(p => ({ ...p, starterCodes: { ...STARTERS, [p.language]: p.starterCode } }));

  }



  async evaluate(userId: string, problemId: string, dto: EvaluateDto) {

    await this.enforcement.assertNotBanned(userId);

    await this.enforcement.assertUnderDailyCap(userId);

    if (!dto.code.trim()) throw new BadRequestException('Write a solution first');

    if (!this.judge.configured) throw new ServiceUnavailableException('Judge0 is not configured');

    const problem = await this.problems.getWithTests(problemId);

    if (!problem.reviewed) throw new NotFoundException('Problem not found');

    const custom = dto.input !== undefined && !dto.submit;

    const tests = custom ? [{ input: dto.input!, expectedOutput: '', sample: true }] : dto.submit ? problem.tests : problem.tests.filter(t => t.sample);

    if (!tests.length) throw new BadRequestException('This problem has no test cases');

    let runs;

    try {

      runs = await this.judge.runBatch(tests.map(t => ({ sourceCode: dto.code, language: dto.language, stdin: t.input, cpuTimeLimitSeconds: problem.timeLimitMs / 1000, memoryLimitKb: problem.memoryLimitMb * 1024 })));

    } catch {

      throw new ServiceUnavailableException('Judge0 is unavailable. Your result has not been recorded; try again.');

    }

    const details = runs.map((run, index) => ({

      caseId: `case_${index}`, passed: run.ok && (custom || outputMatches(run.stdout, tests[index].expectedOutput)),

      // Hidden inputs, expected outputs and stdout must never leave the server.

      input: tests[index].sample ? tests[index].input : 'Hidden',

      expected: tests[index].sample ? tests[index].expectedOutput : 'Hidden',

      actual: tests[index].sample ? (run.stderr || run.stdout).slice(0, 10000) : run.status,

    }));

    const passedCount = details.filter(t => t.passed).length;

    const passed = passedCount === tests.length;

    const runtimeMs = Math.max(0, ...runs.map(r => r.runtimeMs ?? 0));

    const memoryKb = Math.max(0, ...runs.map(r => r.memoryKb ?? 0));

    const analysis = complexityHints(dto.code, dto.language);
    if (dto.submit) await this.db.practiceAttempt.create({ data: { userId, problemId, language: dto.language, passed, passedTests: passedCount, totalTests: tests.length, runtimeMs, memoryKb, analysis } });

    return { status: passed ? 'SUCCESS' : 'FAILED', message: custom ? 'Custom input executed.' : `${passedCount}/${tests.length} tests passed.`, passedCount, totalCount: tests.length, runtimeMs, memoryMb: memoryKb / 1024, details, analysis };

  }



  async practiceState(userId: string) {

    const [attempts, account, problems] = await Promise.all([

      this.db.practiceAttempt.findMany({ where: { userId, passed: true }, orderBy: { createdAt: 'desc' } }),

      this.db.arenaAccount.findUnique({ where: { userId } }),

      this.db.problem.findMany({ select: { id: true, difficulty: true, category: true } }),

    ]);

    const solvedProblemIds = [...new Set(attempts.map(a => a.problemId))];

    const days = new Set(attempts.map(a => a.createdAt.toISOString().slice(0, 10)));

    let practiceStreak = 0;

    const day = new Date();

    if (!days.has(day.toISOString().slice(0, 10))) day.setUTCDate(day.getUTCDate() - 1);

    while (days.has(day.toISOString().slice(0, 10))) { practiceStreak++; day.setUTCDate(day.getUTCDate() - 1); }

    return { solvedProblemIds, bookmarkedProblemIds: account?.bookmarks ?? [], totalPracticeXp: problems.filter(p => solvedProblemIds.includes(p.id)).reduce((sum, p) => sum + xpFor(p.difficulty), 0), practiceStreak, lastSolvedAt: attempts[0]?.createdAt.toISOString() ?? null };

  }



  async bookmark(userId: string, problemId: string, enabled: boolean) {

    await this.problems.getForPlayer(problemId);

    // A row lock prevents simultaneous tabs from overwriting one another's bookmarks.

    await this.db.$transaction(async tx => {

      await tx.arenaAccount.upsert({ where: { userId }, create: { userId }, update: {} });

      await tx.$queryRaw`SELECT "userId" FROM "arena_accounts" WHERE "userId" = ${userId} FOR UPDATE`;

      const row = await tx.arenaAccount.findUniqueOrThrow({ where: { userId } });

      const bookmarks = enabled ? [...new Set([...row.bookmarks, problemId])] : row.bookmarks.filter(id => id !== problemId);

      await tx.arenaAccount.update({ where: { userId }, data: { bookmarks } });

    });

    return this.practiceState(userId);

  }



  async settings(userId: string) {

    return (await this.db.arenaAccount.findUnique({ where: { userId } }))?.settings ?? {};

  }

  async saveSettings(userId: string, dto: SettingsDto) {

    if (JSON.stringify(dto.settings).length > 20000) throw new BadRequestException('Settings are too large');

    return this.db.$transaction(async tx => {
      await tx.arenaAccount.upsert({ where: { userId }, create: { userId }, update: {} });
      await tx.$queryRaw`SELECT "userId" FROM "arena_accounts" WHERE "userId" = ${userId} FOR UPDATE`;
      const account = await tx.arenaAccount.findUniqueOrThrow({ where: { userId } });
      const existing = account.settings && typeof account.settings === 'object' && !Array.isArray(account.settings) ? account.settings as Record<string, Prisma.JsonValue> : {};
      const settings = { ...existing, ...dto.settings };
      // Equipment is validated only by the inventory endpoint. Ordinary settings
      // saves must neither bypass unlocks nor erase previously equipped items.
      for (const key of ['equipped', 'bannerTheme', 'editorTheme', 'title', 'soundPack', 'avatarFrame', 'victoryEffect']) {
        if (existing[key] !== undefined) settings[key] = existing[key]; else delete settings[key];
      }
      await tx.arenaAccount.update({ where: { userId }, data: { settings: settings as Prisma.InputJsonValue } });
      await tx.user.update({ where: { id: userId }, data: { ...(dto.name !== undefined ? { name: dto.name } : {}), ...(dto.bio !== undefined ? { bio: dto.bio } : {}) } });
      return settings;
    });
  }


  async summary(userId: string) {

    const [user, practice, seats] = await Promise.all([

      this.db.user.findUniqueOrThrow({ where: { id: userId }, select: { id: true, name: true, username: true, bio: true, avatarUrl: true, customAvatarUrl: true, createdAt: true, clanMembership: { select: { clan: { select: { name: true, tag: true } } } } } }),

      this.practiceState(userId),

      this.db.battleParticipant.findMany({ where: { userId, isGhost: false, invalidatedAt: null, battle: { state: 'COMPLETE', seriesId: null } }, include: { battle: { include: { problem: { select: { title: true, difficulty: true } } } }, submission: { include: { judgement: true } } }, orderBy: { battle: { completedAt: 'asc' } } }),

    ]);

    let rating = 1200, peakElo = 1200, wins = 0, losses = 0, winStreak = 0, bestStreak = 0;

    const history = seats.map(s => {

      const eligible = s.battle.visibility !== 'GHOST' && s.rank !== null;

      const won = s.rank === 1 && s.submission?.judgement?.passedGate === true;

      const delta = eligible ? won ? 25 : -20 : 0;

      rating = Math.max(0, rating + delta); peakElo = Math.max(peakElo, rating);

      if (eligible) { if (won) { wins++; winStreak++; bestStreak = Math.max(bestStreak, winStreak); } else { losses++; winStreak = 0; } }

      return { id: s.battleId, mode: s.battle.durationSeconds === 300 ? 'BLITZ_DEATHMATCH' : s.battle.durationSeconds === 900 ? 'GAUNTLET' : 'RANKED_1V1', outcome: won ? 'VICTORY' : 'DEFEAT', eloChange: delta, problemTitle: s.battle.problem?.title ?? 'Arena', durationSeconds: s.battle.durationSeconds, casesPassed: `${s.submission?.judgement?.passedTests ?? 0}/${s.submission?.judgement?.totalTests ?? 0}`, timestamp: s.battle.completedAt?.toISOString(), rivalHandle: s.battle.visibility === 'GHOST' ? 'Recorded ghost' : 'Arena opponent', rivalElo: 1200 };

    }).reverse();

    const totalXp = practice.totalPracticeXp + wins * 100;

    const liveWins = seats.filter(s => s.battle.visibility !== 'GHOST' && s.rank === 1 && s.submission?.judgement?.passedGate);

    const wonIn = (seconds: number) => liveWins.filter(s => s.submission?.submittedAt && s.battle.startedAt && (s.submission.submittedAt.getTime() - s.battle.startedAt.getTime()) < seconds * 1000).length;

    const byLanguage = new Map<string, number>();

    liveWins.forEach(s => byLanguage.set(s.battle.language, (byLanguage.get(s.battle.language) ?? 0) + 1));

    const achievementProgress: Record<string, number> = {

      combat_first_blood: wins, combat_gladiator_ten: wins, combat_centurion: wins,

      combat_comeback_kid: liveWins.filter(s => s.battle.endsAt && s.submission?.submittedAt && s.battle.endsAt.getTime() - s.submission.submittedAt.getTime() < 15000).length,

      combat_flawless: wins, speed_demon: liveWins.filter(s => s.battle.difficulty !== 'easy' && s.submission?.submittedAt && s.battle.startedAt && s.submission.submittedAt.getTime() - s.battle.startedAt.getTime() < 180000).length,

      speed_lightning_two_sum: wonIn(90), speed_sub_minute: wonIn(60),

      streak_on_fire_3: bestStreak, streak_on_fire_7: bestStreak, streak_titan_15: bestStreak,

      streak_daily_30: practice.practiceStreak,

      mastery_hard_slayer: new Set(liveWins.filter(s => s.battle.difficulty === 'hard').map(s => s.battle.problemId)).size,

      poly_dual_wield: [...byLanguage.values()].filter(count => count >= 10).length,

      poly_quad_warrior: byLanguage.size, poly_rustacean: byLanguage.get('rust') ?? 0,

      special_night_owl: liveWins.filter(s => { const date = s.submission?.submittedAt; if (!date) return false; const hour = (date.getUTCHours() + 5 + (date.getUTCMinutes() >= 30 ? 1 : 0)) % 24; return hour >= 2 && hour < 5; }).length,

      special_apex_predator: rating,

    };

    const solvedProblems = await this.db.problem.findMany({ where: { id: { in: practice.solvedProblemIds } }, select: { id: true, difficulty: true, category: true } });

    const problemCounts = await this.db.problem.groupBy({ by: ['difficulty'], where: { reviewed: true }, _count: true });

    const memoryPasses = await this.db.practiceAttempt.findMany({ where: { userId, passed: true, memoryKb: { gt: 0, lte: 16384 } }, select: { problemId: true } });
    const clanWars = await this.db.arenaSeries.findMany({ where: { kind: 'CLAN_WAR', state: 'COMPLETE', OR: [{ teamA: { has: userId } }, { teamB: { has: userId } }] }, select: { teamA: true, teamB: true, winnerTeam: true } });
    achievementProgress.special_clan_champion = clanWars.reduce((sum,w) => sum + (w.winnerTeam === null ? 50 : (w.winnerTeam === 0 ? w.teamA : w.teamB).includes(userId) ? 100 : 25), 0);
    achievementProgress.mastery_dp_guru = solvedProblems.filter(p => p.category === 'DYNAMIC_PROGRAMMING').length;
    achievementProgress.mastery_graph_navigator = solvedProblems.filter(p => p.category === 'TREES_GRAPHS').length;
    achievementProgress.mastery_zero_alloc = new Set(memoryPasses.map(a => a.problemId)).size;
    const problemsSolved = { total: practice.solvedProblemIds.length, easy: solvedProblems.filter(p => p.difficulty === 'easy').length, medium: solvedProblems.filter(p => p.difficulty === 'medium').length, hard: solvedProblems.filter(p => p.difficulty === 'hard').length, easyTotal: problemCounts.find(p => p.difficulty === 'easy')?._count ?? 0, mediumTotal: problemCounts.find(p => p.difficulty === 'medium')?._count ?? 0, hardTotal: problemCounts.find(p => p.difficulty === 'hard')?._count ?? 0 };



    return { achievementProgress, problemsSolved, user: { ...user, avatarUrl: user.customAvatarUrl || user.avatarUrl }, practice, profile: { elo: rating, peakElo, tier: tierFor(rating), division: 'I', wins, losses, winStreak, bestStreak, totalXp, history }, level: 1 + Math.floor(Math.sqrt(totalXp / 100)) };

  }



  async leaderboard(timeframe = 'all', limit = 100) {
    if (!['all', 'weekly', 'season'].includes(timeframe)) throw new BadRequestException('Unknown leaderboard timeframe');
    const since = new Date();
    since.setUTCHours(0, 0, 0, 0);
    if (timeframe === 'weekly') since.setUTCDate(since.getUTCDate() - ((since.getUTCDay() + 6) % 7));
    if (timeframe === 'season') { since.setUTCDate(1); since.setUTCMonth(Math.floor(since.getUTCMonth() / 3) * 3); }
    const completedAt = timeframe === 'all' ? {} : { completedAt: { gte: since } };

    const users = await this.db.user.findMany({

      select: { id: true, name: true, username: true, avatarUrl: true, customAvatarUrl: true, clanMembership: { select: { clan: { select: { name: true, tag: true } } } },

        battleEntries: { where: { isGhost: false, invalidatedAt: null, rank: { not: null }, battle: { state: 'COMPLETE', visibility: { not: 'GHOST' }, seriesId: null, ...completedAt } }, orderBy: { battle: { completedAt: 'asc' } }, select: { rank: true, battle: { select: { language: true, startedAt: true } }, submission: { select: { submittedAt: true, judgement: { select: { passedGate: true } } } } } },

      },

    });

    const players = users.map(user => {

      let rating = 1200, wins = 0, losses = 0, currentStreak = 0, bestStreak = 0;

      for (const seat of user.battleEntries) {

        if (seat.rank === 1 && seat.submission?.judgement?.passedGate) { wins++; currentStreak++; rating += 25; bestStreak = Math.max(bestStreak, currentStreak); }

        else { losses++; currentStreak = 0; rating = Math.max(0, rating - 20); }

      }

      const solveTimes = user.battleEntries.filter(s => s.rank === 1 && s.submission?.judgement?.passedGate && s.submission.submittedAt && s.battle.startedAt).map(s => (s.submission!.submittedAt!.getTime() - s.battle.startedAt!.getTime()) / 1000);
      const avgSolveSeconds = solveTimes.length ? Math.round(solveTimes.reduce((a,b) => a+b, 0) / solveTimes.length) : null;
      return { clanName: user.clanMembership?.clan.name, clanTag: user.clanMembership?.clan.tag, avgSolveSeconds, id: user.id, name: user.name || user.username, username: user.username, handle: `@${user.username}`, avatarUrl: user.customAvatarUrl || user.avatarUrl,

        rating, tier: tierFor(rating), tierDivision: 'I', level: 1 + Math.floor(Math.sqrt(wins)), wins, losses, winRate: wins + losses ? `${Math.round(wins / (wins + losses) * 100)}%` : '0%', currentStreak, bestStreak, avgSolveTime: avgSolveSeconds === null ? '—' : `${Math.floor(avgSolveSeconds / 60)}m ${avgSolveSeconds % 60}s`, primaryLanguage: user.battleEntries.at(-1)?.battle.language ?? 'JavaScript', country: '', countryFlag: '' };

    });

    return players.sort((a, b) => b.rating - a.rating || b.wins - a.wins || a.username.localeCompare(b.username)).slice(0, limit).map((p, i) => ({ ...p, rank: i + 1, previousRank: i + 1 }));

  }

}
