import { BadRequestException, ConflictException, ForbiddenException, Inject, Injectable, Logger, NotFoundException } from '@nestjs/common';
import { Cron } from '@nestjs/schedule';
import { Prisma, ArenaSeries } from '@prisma/client';
import { randomInt, randomBytes } from 'node:crypto';
import { PrismaService } from '../../database/prisma.service';
import { ProblemService } from '../battles/problem.service';
import { BattleTimerService } from '../battles/battle-timer.service';
import { EnforcementService } from '../battles/enforcement.service';
import { ArenaService } from './arena.service';
import { CompetitionDto, SharedDraftDto } from './competition.dto';
type Round = { battleId: string; problemId: string; difficulty: string; winner: number | null; testsA?: number; testsB?: number };
const roundsOf = (s: ArenaSeries) => s.rounds as unknown as Round[];
export function seriesDecision(rounds: Round[], winsA: number, winsB: number) {
  const complete = winsA >= 2 || winsB >= 2 || rounds.length >= 3;
  const testsA = rounds.reduce((n,r) => n + (r.testsA ?? 0),0), testsB = rounds.reduce((n,r) => n + (r.testsB ?? 0),0);
  return { complete, winnerTeam: winsA === winsB ? testsA === testsB ? null : testsA > testsB ? 0 : 1 : winsA > winsB ? 0 : 1 };
}
@Injectable()
export class CompetitionService {
  private sweeping = false;
  private readonly logger = new Logger(CompetitionService.name);
  constructor(@Inject(PrismaService) private readonly db: PrismaService, @Inject(ProblemService) private readonly problems: ProblemService, @Inject(ArenaService) private readonly arena: ArenaService, @Inject(BattleTimerService) private readonly timers: BattleTimerService, @Inject(EnforcementService) private readonly enforcement: EnforcementService) {}
  private team(s: ArenaSeries, userId: string) {
    if (s.teamA.includes(userId)) return 0;
    if (s.teamB.includes(userId)) return 1;
    throw new NotFoundException('Competition not found');
  }
  private async load(id: string, userId: string) {
    const s = await this.db.arenaSeries.findUnique({ where: { id } });
    if (!s) throw new NotFoundException('Competition not found');
    this.team(s,userId); return s;
  }
  async list(userId: string) {
    const rows = await this.db.arenaSeries.findMany({ where: { OR: [{ teamA: { has: userId } }, { teamB: { has: userId } }] }, orderBy: { createdAt: 'desc' }, take: 50 });
    // Drafts are never included in a listing, even for the caller's own team.
    return rows.map(({ codeA, codeB, ...s }) => s);
  }
  async create(userId: string, dto: CompetitionDto) {
    await this.enforcement.assertNotBanned(userId);
    if (dto.players.length !== (dto.kind === 'GAUNTLET' ? 1 : 3)) throw new BadRequestException('Gauntlet needs one opponent; team modes need a teammate and two opponents');
    const names = dto.players.map(n => n.trim().replace(/^@/,'').toLowerCase());
    const users = await this.db.user.findMany({ where: { username: { in: names, mode: 'insensitive' } }, select: { id: true, username: true } });
    const ids = names.map(n => users.find(u => u.username.toLowerCase() === n)?.id);
    if (ids.some(id => !id) || new Set([userId,...ids]).size !== ids.length + 1) throw new BadRequestException('Choose distinct registered players other than yourself');
    const players = ids as string[];
    for (const id of players) await this.enforcement.assertNotBanned(id);
    const all = [userId,...players];
    if (await this.db.userBlock.count({ where: { kind: 'BLOCK', blockerId: { in: all }, blockedId: { in: all } } })) throw new ForbiddenException('These players cannot enter a shared competition');
    const teamA = dto.kind === 'GAUNTLET' ? [userId] : [userId,players[0]], teamB = dto.kind === 'GAUNTLET' ? [players[0]] : players.slice(1);
    let clanAId: string | null = null, clanBId: string | null = null;
    if (dto.kind === 'CLAN_WAR') {
      const members = await this.db.arenaClanMember.findMany({ where: { userId: { in: all } } });
      const a = members.find(m => m.userId === userId), b = members.find(m => m.userId === teamB[0]);
      if (!a || !b || a.role !== 'OWNER' || b.role !== 'OWNER' || a.clanId === b.clanId || !teamA.every(id => members.some(m => m.userId === id && m.clanId === a.clanId)) || !teamB.every(id => members.some(m => m.userId === id && m.clanId === b.clanId))) throw new BadRequestException('Each clan war team needs its clan leader and one member from the same clan');
      clanAId = a.clanId; clanBId = b.clanId;
    }
    for (const difficulty of dto.kind === 'GAUNTLET' ? ['easy','medium','hard'] : [dto.difficulty]) if (!await this.db.problem.count({ where: { reviewed: true, language: dto.language, difficulty } })) throw new BadRequestException(`No ${difficulty} problem pool available`);
    return this.db.arenaSeries.create({ data: { kind: dto.kind, ownerId: userId, language: dto.language, difficulty: dto.difficulty, durationSeconds: dto.durationSeconds, teamA, teamB, accepted: [userId], clanAId, clanBId } });
  }
  async accept(id: string, userId: string) {
    await this.enforcement.assertNotBanned(userId);
    return this.db.$transaction(async tx => {
      await tx.$queryRaw`SELECT "id" FROM "arena_series" WHERE "id" = ${id} FOR UPDATE`;
      const s = await tx.arenaSeries.findUnique({ where: { id } });
      if (!s) throw new NotFoundException('Competition not found'); this.team(s,userId);
      if (s.state !== 'INVITED') throw new BadRequestException('Invitations are closed');
      await tx.arenaSeries.update({ where: { id }, data: { accepted: [...new Set([...s.accepted,userId])] } }); return { success: true };
    });
  }
  async start(id: string, userId: string) {
    return this.db.$transaction(async tx => {
      await tx.$queryRaw`SELECT "id" FROM "arena_series" WHERE "id" = ${id} FOR UPDATE`;
      const s = await tx.arenaSeries.findUnique({ where: { id } });
      if (!s) throw new NotFoundException('Competition not found');
      if (s.ownerId !== userId) throw new ForbiddenException('Only the host may start');
      if (s.state !== 'INVITED' || ![...s.teamA,...s.teamB].every(id => s.accepted.includes(id))) throw new BadRequestException('All players must accept before starting');
      await this.nextRound(tx,s,[]); return { success: true };
    });
  }
  private async nextRound(tx: Prisma.TransactionClient, s: ArenaSeries, rounds: Round[]) {
    const difficulty = s.kind === 'GAUNTLET' ? ['easy','medium','hard'][rounds.length] : s.difficulty;
    const pool = await tx.problem.findMany({ where: { reviewed: true, language: s.language, difficulty, id: { notIn: rounds.map(r => r.problemId) } }, select: { id: true, starterCode: true } });
    if (!pool.length) throw new BadRequestException('Not enough distinct reviewed problems for this series');
    const problem = pool[randomInt(pool.length)], now = new Date();
    const battle = await tx.battle.create({ data: { creatorId: s.ownerId, seriesId: s.id, problemId: problem.id, language: s.language, difficulty, visibility: 'PRIVATE', state: 'ACTIVE', capacity: 2, durationSeconds: s.durationSeconds, lobbyExpiresAt: new Date(now.getTime() + 14400000), startedAt: now, endsAt: new Date(now.getTime() + s.durationSeconds * 1000), participants: { create: [s.teamA[0], s.teamB[0]].map(userId => ({ userId, state: 'JOINED', joinedAt: now })) } } });
    await tx.arenaSeries.update({ where: { id: s.id }, data: { state: 'RUNNING', currentBattleId: battle.id, rounds: [...rounds, { battleId: battle.id, problemId: problem.id, difficulty, winner: null }] as unknown as Prisma.InputJsonValue, codeA: problem.starterCode, codeB: problem.starterCode, revisionA: { increment: 1 }, revisionB: { increment: 1 }, submittedA: false, submittedB: false } });
  }
  async get(id: string, userId: string) {
    const s = await this.load(id,userId), team = this.team(s,userId);
    const battle = s.currentBattleId ? await this.db.battle.findUnique({ where: { id: s.currentBattleId }, select: { state: true, endsAt: true, problemId: true, participants: { select: { userId: true, state: true, rank: true, submission: { select: { judgement: { select: { passedTests: true, totalTests: true, runtimeMs: true, memoryKb: true } } } } } } } }) : null;
    const users = await this.db.user.findMany({ where: { id: { in: [...s.teamA,...s.teamB] } }, select: { id: true, username: true, name: true } });
    const { codeA, codeB, ...safe } = s;
    return { ...safe, team, code: team === 0 ? codeA : codeB, revision: team === 0 ? s.revisionA : s.revisionB, submitted: team === 0 ? s.submittedA : s.submittedB, users, battle, problem: battle?.problemId ? await this.problems.getForPlayer(battle.problemId) : null };
  }
  async draft(id: string, userId: string, dto: SharedDraftDto) {
    const s = await this.load(id,userId), team = this.team(s,userId);
    if (s.state !== 'RUNNING') throw new BadRequestException('Series is not running');
    const result = await this.db.arenaSeries.updateMany({ where: { id, state: 'RUNNING', ...(team === 0 ? { revisionA: dto.revision, submittedA: false } : { revisionB: dto.revision, submittedB: false }) }, data: team === 0 ? { codeA: dto.code, revisionA: { increment: 1 } } : { codeB: dto.code, revisionB: { increment: 1 } } });
    if (!result.count) throw new ConflictException('A teammate changed or submitted this draft. Reload the shared draft before saving.');
    return { revision: dto.revision + 1 };
  }
  async run(id: string, userId: string) {
    const s = await this.load(id,userId), team = this.team(s,userId);
    if (s.state !== 'RUNNING' || !s.currentBattleId) throw new BadRequestException('Series is not running');
    const battle = await this.db.battle.findUniqueOrThrow({ where: { id: s.currentBattleId } });
    if (battle.state !== 'ACTIVE' || !battle.endsAt || battle.endsAt.getTime() <= Date.now()) throw new BadRequestException('This round is closed');
    const result = await this.arena.evaluate(userId,battle.problemId!,{ code: team === 0 ? s.codeA : s.codeB, language: s.language, submit: false });
    await this.arena.recordProgress(battle.id,team === 0 ? s.teamA[0] : s.teamB[0],result.passedCount,result.totalCount);
    return result;
  }
  async submit(id: string, userId: string, revision: number) {
    await this.enforcement.assertNotBanned(userId); await this.enforcement.assertUnderDailyCap(userId);
    const battleId = await this.db.$transaction(async tx => {
      await tx.$queryRaw`SELECT "id" FROM "arena_series" WHERE "id" = ${id} FOR UPDATE`;
      const s = await tx.arenaSeries.findUnique({ where: { id } });
      if (!s) throw new NotFoundException('Competition not found'); const team = this.team(s,userId);
      if ((team === 0 ? s.revisionA : s.revisionB) !== revision) throw new ConflictException('A teammate changed this solution. Reload before submitting.');
      if (s.state !== 'RUNNING' || !s.currentBattleId || (team === 0 ? s.submittedA : s.submittedB)) throw new BadRequestException('This team already submitted or the round is closed');
      const battle = await tx.battle.findUniqueOrThrow({ where: { id: s.currentBattleId } });
      if (battle.state !== 'ACTIVE' || !battle.endsAt || battle.endsAt.getTime() <= Date.now()) throw new BadRequestException('The deadline has passed');
      const code = team === 0 ? s.codeA : s.codeB;
      if (!code.trim()) throw new BadRequestException('Save a solution first');
      const seat = await tx.battleParticipant.findUniqueOrThrow({ where: { battleId_userId: { battleId: battle.id, userId: team === 0 ? s.teamA[0] : s.teamB[0] } } });
      await tx.submission.upsert({ where: { participantId: seat.id }, create: { participantId: seat.id, language: s.language, code, submittedAt: new Date() }, update: { code, submittedAt: new Date() } });
      await tx.battleParticipant.update({ where: { id: seat.id }, data: { state: 'SUBMITTED' } });
      await tx.arenaSeries.update({ where: { id }, data: team === 0 ? { submittedA: true } : { submittedB: true } }); return battle.id;
    });
    await this.timers.closeIfEveryoneSubmitted(battleId); return { success: true };
  }
  async advance(id: string) {
    return this.db.$transaction(async tx => {
      await tx.$queryRaw`SELECT "id" FROM "arena_series" WHERE "id" = ${id} FOR UPDATE`;
      const s = await tx.arenaSeries.findUnique({ where: { id } });
      if (!s || s.state !== 'RUNNING' || !s.currentBattleId) return;
      const battle = await tx.battle.findUnique({ where: { id: s.currentBattleId }, include: { participants: { include: { submission: { include: { judgement: true } } } } } });
      if (!battle || !['COMPLETE','ABANDONED'].includes(battle.state)) return;
      const a = battle.participants.find(p => p.userId === s.teamA[0]), b = battle.participants.find(p => p.userId === s.teamB[0]);
      const winner = a?.rank === 1 && a.submission?.judgement?.passedGate ? 0 : b?.rank === 1 && b.submission?.judgement?.passedGate ? 1 : null;
      const rounds = roundsOf(s); rounds[rounds.length - 1] = { ...rounds.at(-1)!, winner, testsA: a?.submission?.judgement?.passedTests ?? 0, testsB: b?.submission?.judgement?.passedTests ?? 0 };
      const winsA = s.winsA + Number(winner === 0), winsB = s.winsB + Number(winner === 1);
      const decision = seriesDecision(rounds,winsA,winsB);
      const updated = await tx.arenaSeries.update({ where: { id }, data: { winsA, winsB, rounds: rounds as unknown as Prisma.InputJsonValue, ...(decision.complete ? { state: 'COMPLETE', winnerTeam: decision.winnerTeam } : {}) } });
      if (!decision.complete) await this.nextRound(tx,updated,rounds);
    }, { timeout: 15000 });
  }
  @Cron('*/10 * * * * *') async sweep() {
    if (this.sweeping || process.env.DISABLE_BATTLE_WORKERS === 'true') return;
    this.sweeping = true;
    try { for (const s of await this.db.arenaSeries.findMany({ where: { state: 'RUNNING' }, select: { id: true }, take: 100 })) { try { await this.advance(s.id); } catch(e) { this.logger.warn(`Series retry: ${e instanceof Error ? e.message : 'unknown error'}`); } } } finally { this.sweeping = false; }
  }
  async shareBattle(id: string, userId: string) {
    const seat = await this.db.battleParticipant.findUnique({ where: { battleId_userId: { battleId: id, userId } } });
    if (!seat || seat.isGhost) throw new NotFoundException('Arena not found');
    const battle = await this.db.battle.findUniqueOrThrow({ where: { id } });
    if (battle.spectatorToken) return { token: battle.spectatorToken };
    const token = randomBytes(32).toString('hex');
    await this.db.battle.updateMany({ where: { id, spectatorToken: null }, data: { spectatorToken: token } });
    return { token: (await this.db.battle.findUniqueOrThrow({ where: { id } })).spectatorToken };
  }
  async shareSeries(id: string, userId: string) { const s = await this.load(id,userId); if (!s.currentBattleId) throw new BadRequestException('Start the competition first'); return this.shareBattle(s.currentBattleId, this.team(s,userId) === 0 ? s.teamA[0] : s.teamB[0]); }
  async revokeBattle(id: string, userId: string) {
    const seat = await this.db.battleParticipant.findUnique({ where: { battleId_userId: { battleId: id, userId } } });
    if (!seat || seat.isGhost) throw new NotFoundException('Arena not found');
    await this.db.battle.update({ where: { id }, data: { spectatorToken: null } }); return { success: true };
  }
  async watch(token: string) {
    const b = await this.db.battle.findUnique({ where: { spectatorToken: token }, select: { id: true, state: true, endsAt: true, language: true, difficulty: true, problemId: true, participants: { select: { userId: true, isGhost: true, rank: true, state: true, user: { select: { username: true, name: true } }, submission: { select: { judgement: { select: { passedTests: true, totalTests: true, runtimeMs: true, memoryKb: true } } } } } } } });
    if (!b) throw new NotFoundException('Spectator link not found');
    return { ...b, progress: await this.arena.progress(b.id,b.participants.map(p => p.userId)), problem: b.problemId && !['OPEN','INVITED','CREATED'].includes(b.state) ? await this.problems.getForPlayer(b.problemId) : null };
  }
}
