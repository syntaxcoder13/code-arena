import { BadRequestException, ConflictException, ForbiddenException, Inject, Injectable, Logger, NotFoundException } from '@nestjs/common';
import { Cron } from '@nestjs/schedule';
import { Prisma, ArenaTournament } from '@prisma/client';
import { randomInt } from 'node:crypto';
import { PrismaService } from '../../database/prisma.service';
import { ArenaService } from './arena.service';
import { EnforcementService } from '../battles/enforcement.service';
import { ClanDto, TournamentDto } from './features.dto';
import { bracketPairs } from './bracket';
import { swissPairs, swissStandings } from './swiss';

export const COSMETICS = [
  { id: 'banner-acid', slot: 'banner', name: 'Acid Grid', value: 'acid-grid', xp: 0, wins: 0 },
  { id: 'banner-cyber', slot: 'banner', name: 'Cyber Monolith', value: 'cyber-dark', xp: 250, wins: 0 },
  { id: 'banner-matrix', slot: 'banner', name: 'Matrix Terminal', value: 'matrix-terminal', xp: 750, wins: 0 },
  { id: 'banner-sunset', slot: 'banner', name: 'Sunset Arcade', value: 'sunset-arcade', xp: 1500, wins: 0 },
  { id: 'editor-dark', slot: 'editor', name: 'Midnight Editor', value: 'vs-dark', xp: 0, wins: 0 },
  { id: 'editor-light', slot: 'editor', name: 'Daylight Editor', value: 'light', xp: 0, wins: 0 },
  { id: 'editor-contrast', slot: 'editor', name: 'High Contrast', value: 'hc-black', xp: 500, wins: 0 },
  { id: 'sound-arcade', slot: 'sound', name: 'Arcade Sound Pack', value: 'arcade', xp: 0, wins: 0 },
  { id: 'sound-retro', slot: 'sound', name: 'Retro Sound Pack', value: 'retro', xp: 250, wins: 0 },
  { id: 'sound-soft', slot: 'sound', name: 'Soft Sound Pack', value: 'soft', xp: 500, wins: 0 },
  { id: 'frame-classic', slot: 'frame', name: 'Classic Frame', value: 'classic', xp: 0, wins: 0 },
  { id: 'frame-neon', slot: 'frame', name: 'Neon Pulse Frame', value: 'neon', xp: 750, wins: 0 },
  { id: 'frame-champion', slot: 'frame', name: 'Champion Frame', value: 'champion', xp: 0, wins: 5 },
  { id: 'effect-spark', slot: 'effect', name: 'Spark Victory', value: 'spark', xp: 0, wins: 0 },
  { id: 'effect-confetti', slot: 'effect', name: 'Confetti Victory', value: 'confetti', xp: 500, wins: 0 },
  { id: 'title-cadet', slot: 'title', name: 'Cadet Coder', value: 'Cadet Coder', xp: 0, wins: 0 },
  { id: 'title-duelist', slot: 'title', name: 'Arena Duelist', value: 'Arena Duelist', xp: 0, wins: 1 },
  { id: 'title-gladiator', slot: 'title', name: 'Code Gladiator', value: 'Code Gladiator', xp: 0, wins: 10 },
] as const;
const defaultEquipment: Record<string,string> = { banner: 'banner-acid', editor: 'editor-dark', title: 'title-cadet', sound: 'sound-arcade', frame: 'frame-classic', effect: 'effect-spark' };
const object = (value: unknown): Record<string, unknown> => value && typeof value === 'object' && !Array.isArray(value) ? value as Record<string, unknown> : {};

@Injectable()
export class ArenaFeaturesService {
  private readonly logger = new Logger(ArenaFeaturesService.name);
  private sweeping = false;
  constructor(@Inject(PrismaService) private readonly db: PrismaService, @Inject(ArenaService) private readonly arena: ArenaService, @Inject(EnforcementService) private readonly enforcement: EnforcementService) {}

  async clans(userId: string) {
    const clans = await this.db.arenaClan.findMany({ include: { members: { include: { user: { select: { id: true, username: true, name: true } } }, orderBy: { joinedAt: 'asc' } } }, orderBy: { createdAt: 'desc' }, take: 100 });
    const ladder = await this.arena.leaderboard('all', Number.MAX_SAFE_INTEGER);
    const ratings = new Map(ladder.map(p => [p.id, p.rating]));
    const wars = await this.db.arenaSeries.findMany({ where: { kind: 'CLAN_WAR', state: 'COMPLETE' }, select: { clanAId: true, clanBId: true, winnerTeam: true } });
    const points = new Map<string,number>();
    for (const w of wars) for (const [team,id] of [w.clanAId,w.clanBId].entries()) if (id) points.set(id,(points.get(id) ?? 0) + (w.winnerTeam === team ? 100 : w.winnerTeam === null ? 50 : 25));
    return clans.map(c => ({ ...c, warPoints: points.get(c.id) ?? 0, isMember: c.members.some(m => m.userId === userId), isOwner: c.members.some(m => m.userId === userId && m.role === 'OWNER'), averageRating: Math.round(c.members.reduce((sum, m) => sum + (ratings.get(m.userId) ?? 1200), 0) / Math.max(1, c.members.length)) })).sort((a,b) => b.warPoints - a.warPoints || b.averageRating - a.averageRating);
  }
  async createClan(userId: string, dto: ClanDto) {
    await this.enforcement.assertNotBanned(userId);
    if (!dto.name.trim()) throw new BadRequestException('Name is required');
    try { return await this.db.arenaClan.create({ data: { ...dto, name: dto.name.trim(), members: { create: { userId, role: 'OWNER' } } } }); }
    catch (e) { if (e instanceof Prisma.PrismaClientKnownRequestError && e.code === 'P2002') throw new ConflictException('You already belong to a clan, or that name/tag is taken'); throw e; }
  }
  async joinClan(userId: string, id: string) {
    await this.enforcement.assertNotBanned(userId);
    return this.db.$transaction(async tx => {
      await tx.$queryRaw`SELECT "id" FROM "arena_clans" WHERE "id" = ${id} FOR UPDATE`;
      const clan = await tx.arenaClan.findUnique({ where: { id }, include: { members: true } });
      if (!clan) throw new NotFoundException('Clan not found');
      const current = await tx.arenaClanMember.findUnique({ where: { userId } });
      if (current?.clanId === id) return current;
      if (current) throw new ConflictException('Leave your current clan first');
      if (clan.members.length >= 20) throw new BadRequestException('Clan is full (20 members)');
      try { return await tx.arenaClanMember.create({ data: { userId, clanId: id } }); }
      catch (e) { if (e instanceof Prisma.PrismaClientKnownRequestError && e.code === 'P2002') throw new ConflictException('You already joined a clan'); throw e; }
    });
  }
  async leaveClan(userId: string, id: string) {
    return this.db.$transaction(async tx => {
      await tx.$queryRaw`SELECT "id" FROM "arena_clans" WHERE "id" = ${id} FOR UPDATE`;
      const member = await tx.arenaClanMember.findUnique({ where: { userId } });
      if (!member || member.clanId !== id) throw new NotFoundException('Membership not found');
      if (member.role === 'OWNER') throw new BadRequestException('Transfer leadership before leaving');
      await tx.arenaClanMember.delete({ where: { userId } });
      return { success: true };
    });
  }
  async transferClan(userId: string, id: string, target: string) {
    return this.db.$transaction(async tx => {
      await tx.$queryRaw`SELECT "id" FROM "arena_clans" WHERE "id" = ${id} FOR UPDATE`;
      const [owner, next] = await Promise.all([tx.arenaClanMember.findUnique({ where: { userId } }), tx.arenaClanMember.findUnique({ where: { userId: target } })]);
      if (owner?.clanId !== id || owner.role !== 'OWNER') throw new ForbiddenException('Only the clan owner can transfer leadership');
      if (next?.clanId !== id || target === userId) throw new BadRequestException('Choose another member of this clan');
      await tx.arenaClanMember.update({ where: { userId }, data: { role: 'MEMBER' } });
      await tx.arenaClanMember.update({ where: { userId: target }, data: { role: 'OWNER' } });
      return { success: true };
    });
  }

  async inventory(userId: string) {
    const [s, settings] = await Promise.all([this.arena.summary(userId), this.arena.settings(userId)]);
    const equipped = { ...defaultEquipment, ...object(object(settings).equipped) };
    return { xp: s.profile.totalXp, wins: s.profile.wins, equipped, items: COSMETICS.map(item => ({ ...item, unlocked: s.profile.totalXp >= item.xp && s.profile.wins >= item.wins, equipped: equipped[item.slot] === item.id })) };
  }
  async equip(userId: string, itemId: string) {
    const inventory = await this.inventory(userId);
    const item = inventory.items.find(i => i.id === itemId);
    if (!item) throw new NotFoundException('Item not found');
    if (!item.unlocked) throw new ForbiddenException('Earn the required XP or wins to unlock this item');
    await this.db.$transaction(async tx => {
      await tx.arenaAccount.upsert({ where: { userId }, create: { userId }, update: {} });
      await tx.$queryRaw`SELECT "userId" FROM "arena_accounts" WHERE "userId" = ${userId} FOR UPDATE`;
      const row = await tx.arenaAccount.findUniqueOrThrow({ where: { userId } });
      const settings = object(row.settings);
      const equipped = { ...defaultEquipment, ...object(settings.equipped), [item.slot]: item.id };
      await tx.arenaAccount.update({ where: { userId }, data: { settings: { ...settings, equipped, ...(item.slot === 'banner' ? { bannerTheme: item.value } : {}), ...(item.slot === 'editor' ? { editorTheme: item.value } : {}), ...(item.slot === 'title' ? { title: item.value } : {}), ...(item.slot === 'sound' ? { soundPack: item.value } : {}), ...(item.slot === 'frame' ? { avatarFrame: item.value } : {}), ...(item.slot === 'effect' ? { victoryEffect: item.value } : {}) } as Prisma.InputJsonValue } });
    });
    return this.inventory(userId);
  }

  async analytics(userId: string) {
    const [attempts, battles, problems] = await Promise.all([
      this.db.practiceAttempt.findMany({ where: { userId }, orderBy: { createdAt: 'asc' }, take: 10000 }),
      this.db.battleParticipant.findMany({ where: { userId, isGhost: false, battle: { state: 'COMPLETE' } }, include: { battle: { select: { completedAt: true, language: true, difficulty: true, startedAt: true } }, submission: { include: { judgement: true } } } }),
      this.db.problem.findMany({ select: { id: true, difficulty: true } }),
    ]);
    const difficulties = new Map(problems.map(p => [p.id, p.difficulty]));
    const rows = [
      ...attempts.map(a => ({ language: a.language, difficulty: difficulties.get(a.problemId) ?? 'unknown', passed: a.passed, runtimeMs: a.runtimeMs, memoryKb: a.memoryKb, date: a.createdAt.toISOString().slice(0,10) })),
      ...battles.map(b => ({ language: b.battle.language, difficulty: b.battle.difficulty, passed: b.submission?.judgement?.passedGate ?? false, runtimeMs: b.submission?.judgement?.runtimeMs ?? null, memoryKb: b.submission?.judgement?.memoryKb ?? null, date: b.battle.completedAt!.toISOString().slice(0,10) })),
    ];
    const group = (key: 'language' | 'difficulty' | 'date') => [...new Set(rows.map(r => r[key]))].sort().map(name => { const matches = rows.filter(r => r[key] === name); const measured = matches.filter(r => r.runtimeMs !== null); return { name, attempts: matches.length, accepted: matches.filter(r => r.passed).length, avgRuntimeMs: measured.length ? Math.round(measured.reduce((sum,r) => sum + r.runtimeMs!,0) / measured.length) : null }; });
    const accepted = rows.filter(r => r.passed).length;
    return { attempts: rows.length, accepted, acceptanceRate: rows.length ? Math.round(accepted / rows.length * 100) : 0, languages: group('language'), difficulties: group('difficulty'), activity: group('date').slice(-90), recent: rows.slice().sort((a,b) => b.date.localeCompare(a.date)).slice(0,20), memoryPeakKb: Math.max(0, ...rows.map(r => r.memoryKb ?? 0)) };
  }

  async createTournament(userId: string, dto: TournamentDto) {
    await this.enforcement.assertNotBanned(userId);
    if (!dto.name.trim()) throw new BadRequestException('Name is required');
    if (!await this.db.problem.count({ where: { reviewed: true, difficulty: dto.difficulty, language: dto.language } })) throw new BadRequestException('No reviewed problems in this pool');
    return this.db.arenaTournament.create({ data: { ...dto, name: dto.name.trim(), creatorId: userId, entries: { create: { userId } } } });
  }
  async tournaments() {
    const tournaments = await this.db.arenaTournament.findMany({ include: { entries: { include: { user: { select: { id: true, username: true, name: true } } }, orderBy: { joinedAt: 'asc' } }, matches: { orderBy: [{ round: 'asc' }, { position: 'asc' }] } }, orderBy: { createdAt: 'desc' }, take: 50 });
    return tournaments.map(t => ({ ...t, standings: t.format === 'SWISS' ? swissStandings(t.entries.map(e => e.userId),t.matches) : [] }));
  }
  async joinTournament(userId: string, id: string, leave = false) {
    await this.enforcement.assertNotBanned(userId);
    return this.db.$transaction(async tx => {
      await tx.$queryRaw`SELECT "id" FROM "arena_tournaments" WHERE "id" = ${id} FOR UPDATE`;
      const t = await tx.arenaTournament.findUnique({ where: { id }, include: { entries: true } });
      if (!t) throw new NotFoundException('Tournament not found');
      if (t.state !== 'OPEN') throw new BadRequestException('Registration is closed');
      if (leave) {
        if (t.creatorId === userId) throw new BadRequestException('The organizer must remain registered');
        await tx.arenaTournamentEntry.deleteMany({ where: { tournamentId: id, userId } }); return { success: true };
      }
      if (t.entries.some(e => e.userId === userId)) return { success: true };
      if (t.entries.length >= t.capacity) throw new BadRequestException('Tournament is full');
      await tx.arenaTournamentEntry.create({ data: { tournamentId: id, userId } }); return { success: true };
    });
  }
  async startTournament(userId: string, id: string) {
    await this.enforcement.assertNotBanned(userId);
    return this.db.$transaction(async tx => {
      await tx.$queryRaw`SELECT "id" FROM "arena_tournaments" WHERE "id" = ${id} FOR UPDATE`;
      const t = await tx.arenaTournament.findUnique({ where: { id }, include: { entries: true } });
      if (!t) throw new NotFoundException('Tournament not found');
      if (t.creatorId !== userId) throw new ForbiddenException('Only the organizer may start');
      if (t.state !== 'OPEN') throw new BadRequestException('Tournament already started');
      if (t.entries.length < 2) throw new BadRequestException('At least two entrants are required');
      const players = t.entries.map(e => e.userId);
      for (let i = players.length - 1; i > 0; i--) { const j = randomInt(i + 1); [players[i], players[j]] = [players[j], players[i]]; }
      await tx.arenaTournament.update({ where: { id }, data: { state: 'RUNNING', startedAt: new Date() } });
      await this.makeRound(tx, t, players, 1); return { success: true };
    }, { timeout: 15000 });
  }
  private async makeRound(tx: Prisma.TransactionClient, t: ArenaTournament, players: string[], round: number) {
    const pool = await tx.problem.findMany({ where: { reviewed: true, difficulty: t.difficulty, language: t.language }, select: { id: true } });
    if (!pool.length) throw new BadRequestException('No reviewed problems are available');
    const problemId = pool[randomInt(pool.length)].id;
    const history = t.format === 'SWISS' ? await tx.arenaTournamentMatch.findMany({ where: { tournamentId: t.id } }) : [];
    const pairs = t.format === 'SWISS' ? swissPairs(players, history) : bracketPairs(players);
    for (const [i, { a, b }] of pairs.entries()) {
      let battleId: string | null = null;
      if (b) {
        const now = new Date();
        const battle = await tx.battle.create({ data: { creatorId: t.creatorId, problemId, difficulty: t.difficulty, language: t.language, visibility: 'PRIVATE', state: 'ACTIVE', capacity: 2, durationSeconds: t.durationSeconds, lobbyExpiresAt: new Date(now.getTime() + 14400000), startedAt: now, endsAt: new Date(now.getTime() + t.durationSeconds * 1000), participants: { create: [{ userId: a, state: 'JOINED', joinedAt: now }, { userId: b, state: 'JOINED', joinedAt: now }] } } });
        battleId = battle.id;
      }
      await tx.arenaTournamentMatch.create({ data: { tournamentId: t.id, round, position: i, playerAId: a, playerBId: b, battleId, ...(!b ? { winnerId: a, resolution: 'BYE' } : {}) } });
    }
  }
  async advanceTournament(id: string) {
    return this.db.$transaction(async tx => {
      await tx.$queryRaw`SELECT "id" FROM "arena_tournaments" WHERE "id" = ${id} FOR UPDATE`;
      const t = await tx.arenaTournament.findUnique({ where: { id }, include: { entries: { orderBy: { joinedAt: 'asc' } }, matches: { orderBy: [{ round: 'desc' }, { position: 'asc' }], include: { battle: { include: { participants: { include: { submission: { include: { judgement: true } } } } } } } } } });
      if (!t || t.state !== 'RUNNING' || !t.matches.length) return;
      const round = t.matches[0].round;
      const matches = t.matches.filter(m => m.round === round);
      for (const match of matches) {
        if (match.winnerId || !match.battle || !['COMPLETE', 'ABANDONED'].includes(match.battle.state)) continue;
        const ranked = match.battle.participants.filter(p => p.invalidatedAt === null && p.rank !== null).sort((a,b) => a.rank! - b.rank!);
        const winnerId = ranked[0]?.userId ?? match.playerAId;
        await tx.arenaTournamentMatch.update({ where: { id: match.id }, data: { winnerId, resolution: ranked.length ? 'JUDGED_STANDING' : 'NO_SUBMISSION_SEED_TIEBREAK' } });
        match.winnerId = winnerId;
      }
      if (matches.some(m => !m.winnerId)) return;
      const winners = matches.map(m => m.winnerId!);
      if (t.format === 'SWISS') {
        const players = t.entries.map(e => e.userId);
        if (round >= t.roundLimit) {
          const history = await tx.arenaTournamentMatch.findMany({ where: { tournamentId: id } });
          const standings = swissStandings(players, history);
          await tx.arenaTournament.update({ where: { id }, data: { state: 'COMPLETE', winnerId: standings[0].userId } });
        } else await this.makeRound(tx, t, players, round + 1);
        return;
      }
      if (winners.length === 1) await tx.arenaTournament.update({ where: { id }, data: { state: 'COMPLETE', winnerId: winners[0] } });
      else await this.makeRound(tx, t, winners, round + 1);
    }, { timeout: 15000 });
  }
  @Cron('*/10 * * * * *')
  async sweepTournaments() {
    if (this.sweeping || process.env.DISABLE_BATTLE_WORKERS === 'true') return;
    this.sweeping = true;
    try {
      const running = await this.db.arenaTournament.findMany({ where: { state: 'RUNNING' }, select: { id: true }, take: 100 });
      for (const t of running) { try { await this.advanceTournament(t.id); } catch (e) { this.logger.warn(`Tournament ${t.id} will retry: ${e instanceof Error ? e.message : 'unknown error'}`); } }
    } finally { this.sweeping = false; }
  }
}
