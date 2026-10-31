import { EventsService } from '../events/events.service';
import { Optional } from '@nestjs/common';
import { BadRequestException,ForbiddenException,Inject,Injectable,NotFoundException } from '@nestjs/common';
import { Battle,BattleVisibility,ParticipantState,User } from '@prisma/client';
import { PrismaService,withDbRetry } from '../../database/prisma.service';
import { BlockService } from '../moderation/block.service';
import { EnforcementService } from './enforcement.service';
import { displayAvatar } from '../../common/utils/avatar';
import {
battleEndFrom,
canTransition,
drawProblemId,
isLobby,
isValidCapacity,
isValidDifficulty,
isValidDuration,
creationWindowStart,
lobbyExpiryFrom,
MIN_BATTLE_CAPACITY,
openingState,
WEEKLY_BATTLE_CREATION_LIMIT,
} from './battle.state';
import { CreatePrivateBattleDto,CreatePublicBattleDto } from './dto/battles.dto';

const PARTICIPANT_USER_SELECT = {
  id: true,
  username: true,
  name: true,
  avatarUrl: true,
  customAvatarUrl: true,
} as const;

type ParticipantUser = Pick<User, 'id' | 'username' | 'name' | 'avatarUrl' | 'customAvatarUrl'>;

export interface BattleParticipantView {
  userId: string;
  username: string;
  name: string;
  avatarUrl: string;
  state: ParticipantState;
  joinedAt: string | null;
  isCreator: boolean;
  /**
   * A copy of this person's old submission, raced in their absence - not them
   * playing. Without it on the wire a ghost battle is indistinguishable from a
   * live one, and the challenger reasonably concludes somebody is sitting on
   * the other side of it. Nobody is.
   */
  isGhost: boolean;
}

/** A public lobby as it appears in the list, before anybody opens it. */
export interface OpenLobbyView {
  id: string;
  difficulty: string;
  language: string;
  capacity: number;
  durationSeconds: number;
  /** How many have joined, so a full lobby reads as full. */
  joined: number;
  lobbyExpiresAt: string;
  createdAt: string;
  createdBy: { username: string; name: string; avatarUrl: string };
  /** Whether the caller is already in it. */
  joinedByMe: boolean;
}

export interface BattleView {
  id: string;
  visibility: BattleVisibility;
  state: Battle['state'];
  capacity: number;
  durationSeconds: number;
  lobbyExpiresAt: string;
  startedAt: string | null;
  endsAt: string | null;
  createdAt: string;
  /** The pool the problem will be drawn from; known from the start. */
  difficulty: string;
  language: string;
  /**
   * Null until the battle starts. Nobody - the creator included - knows which
   * problem it will be, so nobody can prepare for it while the lobby fills.
   */
  problemId: string | null;
  creatorId: string;
  participants: BattleParticipantView[];
  me: { state: ParticipantState | null; isCreator: boolean };
}

/**
 * Join reads keep polling to one database round trip. On Prisma 6.4.1,
 * concurrent findUnique reads with an explicit relationLoadStrategy can panic
 * during automatic batching. Use findFirst with the same unique ID predicate
 * for battle reads to bypass that batching path without changing visibility.
 */
const BATTLE_INCLUDE = {
  participants: {
    orderBy: { createdAt: 'asc' },
    include: { user: { select: PARTICIPANT_USER_SELECT } },
  },
} as const;

/**
 * Creating a battle and filling its lobby.
 *
 * Public and private battles are the same engine; only the way in differs, so
 * everything here is written against `visibility` rather than duplicated.
 * Starting, running and judging a battle come in later phases.
 */
@Injectable()
export class BattleService {
  constructor(
    @Inject(PrismaService) private readonly prisma: PrismaService,
    @Inject(BlockService) private readonly blocks: BlockService,
    @Inject(EnforcementService) private readonly enforcement: EnforcementService,
    @Optional() @Inject(EventsService) private readonly events?: EventsService,
  ) {}

  /**
   * Opens a private battle and invites people to it.
   *
   * You may only invite developers you follow - that is what keeps a private
   * battle from being a channel for messaging strangers.
   */
  public async createPrivate(userId: string, dto: CreatePrivateBattleDto): Promise<BattleView> {
    await this.enforcement.assertNotBanned(userId);
    if (!isValidCapacity(dto.capacity)) {
      throw new BadRequestException('A battle needs between 2 and 20 seats');
    }
    if (!isValidDuration(dto.durationSeconds)) {
      throw new BadRequestException('Pick one of the offered battle durations');
    }

    if (!isValidDifficulty(dto.difficulty)) {
      throw new BadRequestException('Pick one of the offered difficulties');
    }
    const difficulty = dto.difficulty;
    const language = dto.language.trim().toLowerCase();

    // The problem itself is drawn at start; all we check now is that the pool
    // the creator asked for is not empty.
    const available = await withDbRetry(() =>
      this.prisma.problem.count({ where: { reviewed: true, difficulty, language } }),
    );
    if (available === 0) {
      throw new NotFoundException(`No ${difficulty} problems available in ${language}`);
    }

    await this.assertWeeklyLimit(userId, 'PRIVATE');

    const invitees = await this.resolveInvitees(userId, dto.invitees, dto.capacity);

    const now = new Date();
    const battle = await withDbRetry(() =>
      this.prisma.battle.create({
        data: {
          creatorId: userId,
          // Drawn at start, not now
          problemId: null,
          difficulty,
          language,
          visibility: 'PRIVATE',
          state: openingState('PRIVATE'),
          capacity: dto.capacity,
          durationSeconds: dto.durationSeconds,
          lobbyExpiresAt: lobbyExpiryFrom(now),
          participants: {
            create: [
              // The creator is in from the start; everyone else has to accept
              { userId, state: 'JOINED', joinedAt: now },
              ...invitees.map((invitee) => ({ userId: invitee.id, state: 'INVITED' as const })),
            ],
          },
        },
        include: BATTLE_INCLUDE,
      }),
    );

    void this.events?.notify('battle.changed', battle.id);
    return toBattleView(battle, userId);
  }

  /**
   * Opens a public battle, which anybody may join.
   *
   * Nobody is invited, so the creator is the only participant until somebody
   * finds the lobby. That is the point: a player with no connections can
   * still get into a battle, which the private path cannot give them.
   */
  public async createPublic(userId: string, dto: CreatePublicBattleDto, visibility: 'PUBLIC' | 'PRIVATE' = 'PUBLIC'): Promise<BattleView> {
    await this.enforcement.assertNotBanned(userId);
    await this.assertPoolExists(dto.difficulty, dto.language);
    if (!isValidCapacity(dto.capacity)) {
      throw new BadRequestException('A battle needs between 2 and 20 seats');
    }
    if (!isValidDuration(dto.durationSeconds)) {
      throw new BadRequestException('Pick one of the offered battle durations');
    }
    await this.assertWeeklyLimit(userId, visibility);

    const now = new Date();
    const battle = await withDbRetry(() =>
      this.prisma.battle.create({
        data: {
          creatorId: userId,
          problemId: null,
          difficulty: dto.difficulty,
          language: dto.language.trim().toLowerCase(),
          visibility,
          state: openingState(visibility),
          capacity: dto.capacity,
          durationSeconds: dto.durationSeconds,
          lobbyExpiresAt: lobbyExpiryFrom(now),
          participants: { create: [{ userId, state: 'JOINED', joinedAt: now }] },
        },
        include: BATTLE_INCLUDE,
      }),
    );

    void this.events?.notify('battle.changed', battle.id);
    return toBattleView(battle, userId);
  }

  /**
   * Every public lobby still waiting for players.
   *
   * Full lobbies are listed too, marked by their own count, because a lobby
   * that vanishes the moment it fills makes the list flicker for everyone
   * reading it.
   */
  public async listOpenLobbies(userId: string): Promise<OpenLobbyView[]> {
    const lobbies = await withDbRetry(() =>
      this.prisma.battle.findMany({
        where: {
          visibility: 'PUBLIC',
          state: 'OPEN',
          lobbyExpiresAt: { gt: new Date() },
        },
        orderBy: { createdAt: 'desc' },
        take: 50,
        select: {
          id: true,
          difficulty: true,
          language: true,
          capacity: true,
          durationSeconds: true,
          lobbyExpiresAt: true,
          createdAt: true,
          creator: { select: { username: true, name: true, avatarUrl: true, customAvatarUrl: true } },
          participants: { select: { userId: true, state: true } },
        },
      }),
    );

    // Filtered after the query rather than inside it: the barred list is
    // short, and pushing it into the `where` would need a correlated subquery
    // on a list that is capped at fifty rows anyway.
    const barred = new Set(await this.blocks.blockedIds(userId));
    const visible = lobbies.filter(
      (lobby) => !lobby.participants.some((p) => barred.has(p.userId)),
    );

    return visible.map((lobby) => ({
      id: lobby.id,
      difficulty: lobby.difficulty,
      language: lobby.language,
      capacity: lobby.capacity,
      durationSeconds: lobby.durationSeconds,
      joined: lobby.participants.filter((p) => p.state === 'JOINED').length,
      lobbyExpiresAt: lobby.lobbyExpiresAt.toISOString(),
      createdAt: lobby.createdAt.toISOString(),
      createdBy: {
        username: lobby.creator.username,
        name: lobby.creator.name || lobby.creator.username,
        avatarUrl: displayAvatar(lobby.creator),
      },
      joinedByMe: lobby.participants.some((p) => p.userId === userId && p.state === 'JOINED'),
    }));
  }

  /**
   * Takes a seat in a public battle.
   *
   * No invitation and no follow: that is what makes the public path worth
   * having. Joining twice is not an error, so a double click cannot fail.
   */
  public async joinPublic(battleId: string, userId: string): Promise<BattleView> {
    const battle = await withDbRetry(() =>
      this.prisma.battle.findFirst({ where: { id: battleId }, include: BATTLE_INCLUDE, relationLoadStrategy: 'join' }),
    );
    if (!battle || battle.visibility !== 'PUBLIC') {
      throw new NotFoundException('Battle not found');
    }
    if (!isLobby(battle.state)) {
      throw new BadRequestException('This battle is no longer taking players');
    }
    if (battle.lobbyExpiresAt.getTime() <= Date.now()) {
      throw new BadRequestException('This battle expired before you could join');
    }

    const existing = battle.participants.find((participant) => participant.userId === userId);
    if (existing?.state === 'JOINED') {
      void this.events?.notify('battle.changed', battle.id);
    return toBattleView(battle, userId);
    }

    // Checked after the idempotent re-join above, so somebody banned while
    // already sitting in a lobby can still see where they are.
    await this.enforcement.assertNotBanned(userId);

    const joinedAlready = battle.participants.filter(
      (participant) => participant.state === 'JOINED',
    );
    if (joinedAlready.length >= battle.capacity) {
      throw new ForbiddenException('This battle is full');
    }

    // An open lobby is open to anyone except the people this player has
    // already decided they are done with, in either direction.
    const barred = new Set(await this.blocks.blockedIds(userId));
    if (joinedAlready.some((participant) => barred.has(participant.userId))) {
      throw new ForbiddenException('You cannot join this battle');
    }

    const now = new Date();
    await withDbRetry(() =>
      existing
        ? this.prisma.battleParticipant.update({
            where: { id: existing.id },
            // joinedAt is written once, so leaving and rejoining buys no clock
            data: { state: 'JOINED', joinedAt: existing.joinedAt ?? now },
          })
        : this.prisma.battleParticipant.create({
            data: { battleId, userId, state: 'JOINED', joinedAt: now },
          }),
    );

    void this.events?.notify('battle.changed', battleId);
    return this.getBattle(battleId, userId);
  }

  /** The pool a creator asked for has to hold something to draw. */
  private async assertPoolExists(difficulty: string, language: string): Promise<void> {
    if (!isValidDifficulty(difficulty)) {
      throw new BadRequestException('Pick one of the offered difficulties');
    }
    const available = await withDbRetry(() =>
      this.prisma.problem.count({
        where: { reviewed: true, difficulty, language: language.trim().toLowerCase() },
      }),
    );
    if (available === 0) {
      throw new NotFoundException(`No ${difficulty} problems available in ${language}`);
    }
  }

  /**
   * Caps how many battles one account may open in a week.
   *
   * Only creating is capped. Joining stays unlimited, so the limit slows down
   * somebody filling the lobby list without ever stopping anyone playing.
   */
  private async assertWeeklyLimit(userId: string, visibility: BattleVisibility): Promise<void> {
    const allowed =
      visibility === 'PUBLIC'
        ? WEEKLY_BATTLE_CREATION_LIMIT.public
        : WEEKLY_BATTLE_CREATION_LIMIT.private;

    const made = await withDbRetry(() =>
      this.prisma.battle.count({
        where: { creatorId: userId, visibility, createdAt: { gte: creationWindowStart() } },
      }),
    );
    if (made >= allowed) {
      throw new ForbiddenException(
        `You have opened ${made} ${visibility.toLowerCase()} battles this week, and ${allowed} is the limit. Joining somebody else's is not capped.`,
      );
    }
  }

  /** Turns usernames into users, rejecting anyone the creator cannot invite. */
  private async resolveInvitees(
    creatorId: string,
    usernames: string[],
    capacity: number,
  ): Promise<ParticipantUser[]> {
    const wanted = [...new Set(usernames.map((name) => name.trim().toLowerCase().replace(/^@/, '')))].filter(
      Boolean,
    );
    if (wanted.length === 0) {
      throw new BadRequestException('Invite at least one developer');
    }
    // The creator takes one of the seats
    if (wanted.length > capacity - 1) {
      throw new BadRequestException(`A ${capacity}-seat battle can invite at most ${capacity - 1} developers`);
    }

    // The follow check rides along on the user lookup rather than costing a
    // second round trip: `followersRelation` narrowed to this creator is
    // non-empty exactly when they follow that user.
    const users = await withDbRetry(() =>
      this.prisma.user.findMany({
        where: { username: { in: wanted, mode: 'insensitive' } },
        select: {
          ...PARTICIPANT_USER_SELECT,
          followersRelation: { where: { followerId: creatorId }, select: { id: true }, take: 1 },
        },
      }),
    );

    const found = new Map(users.map((user) => [user.username.toLowerCase(), user]));
    const missing = wanted.filter((name) => !found.has(name));
    if (missing.length > 0) {
      throw new NotFoundException(`Not on OpenSourceHub: ${missing.join(', ')}`);
    }
    if (users.some((user) => user.id === creatorId)) {
      throw new BadRequestException('You cannot invite yourself');
    }

    const notFollowed = users.filter((user) => user.followersRelation.length === 0);
    if (notFollowed.length > 0) {
      throw new BadRequestException(
        `You can only invite developers you follow: ${notFollowed.map((u) => u.username).join(', ')}`,
      );
    }

    // Blocking removes the follow in both directions, so this rarely fires -
    // but a follow can be made again, and being invited into a battle by
    // somebody you blocked is precisely what blocking is for.
    const barred = new Set(await this.blocks.blockedIds(creatorId));
    const unreachable = users.filter((user) => barred.has(user.id));
    if (unreachable.length > 0) {
      throw new BadRequestException(
        `You cannot invite: ${unreachable.map((u) => u.username).join(', ')}`,
      );
    }

    return users.map(({ followersRelation, ...user }) => user);
  }

  /**
   * Loads a battle the caller is allowed to see.
   *
   * A private battle is visible to its participants only, and a stranger gets
   * 404 rather than 403 - confirming that an id exists is itself a leak. A
   * public lobby is readable by any signed-in user, because that is how they
   * find one to join.
   */
  public async getBattle(battleId: string, userId: string): Promise<BattleView> {
    const battle = await withDbRetry(() =>
      this.prisma.battle.findFirst({ where: { id: battleId }, include: BATTLE_INCLUDE, relationLoadStrategy: 'join' }),
    );
    if (!battle) {
      throw new NotFoundException('Battle not found');
    }

    const isParticipant = battle.participants.some((participant) => participant.userId === userId);
    const publiclyVisible = battle.visibility === 'PUBLIC' && isLobby(battle.state);
    if (!isParticipant && !publiclyVisible) {
      throw new NotFoundException('Battle not found');
    }

    return toBattleView(battle, userId);
  }

  /** Every battle the caller is part of, newest first. */
  public async listMine(userId: string): Promise<BattleView[]> {
    const battles = await withDbRetry(() =>
      this.prisma.battle.findMany({
        // A ghost is a copy of somebody's old code, not them playing. Their
        // own list must not fill up with battles they were never in.
        where: { participants: { some: { userId, isGhost: false } } },
        orderBy: { createdAt: 'desc' },
        take: 50,
        include: BATTLE_INCLUDE,
        relationLoadStrategy: 'join',
      }),
    );
    return battles.map((battle) => toBattleView(battle, userId));
  }

  /**
   * Starts the battle: draws the problem and sets one clock for everyone.
   *
   * Only the creator may start, and only with at least two players in - a solo
   * battle would be a free win. They cannot stop it again: `endsAt` is fixed
   * here, because a creator who could end the battle would submit and cut
   * everyone else off.
   */
  public async startBattle(battleId: string, userId: string): Promise<BattleView> {
    const battle = await withDbRetry(() =>
      this.prisma.battle.findFirst({ where: { id: battleId }, include: BATTLE_INCLUDE, relationLoadStrategy: 'join' }),
    );
    if (!battle || !battle.participants.some((participant) => participant.userId === userId)) {
      throw new NotFoundException('Battle not found');
    }
    if (battle.creatorId !== userId) {
      throw new ForbiddenException('Only the player who opened the battle can start it');
    }
    if (!isLobby(battle.state) || !canTransition(battle.state, 'ACTIVE')) {
      throw new BadRequestException('This battle has already started');
    }
    if (battle.lobbyExpiresAt.getTime() <= Date.now()) {
      throw new BadRequestException('This battle expired before it was started');
    }

    const joined = battle.participants.filter((participant) => participant.state === 'JOINED').length;
    if (joined < MIN_BATTLE_CAPACITY) {
      throw new BadRequestException(`A battle needs at least ${MIN_BATTLE_CAPACITY} players to start`);
    }

    const candidates = await withDbRetry(() =>
      this.prisma.problem.findMany({
        where: { reviewed: true, difficulty: battle.difficulty, language: battle.language },
        select: { id: true },
      }),
    );
    const problemId = drawProblemId(candidates.map((candidate) => candidate.id));
    if (!problemId) {
      throw new NotFoundException('No problems are available for this battle any more');
    }

    const startedAt = new Date();
    const started = await withDbRetry(() =>
      this.prisma.battle.update({
        where: { id: battle.id },
        data: {
          state: 'ACTIVE',
          problemId,
          startedAt,
          endsAt: battleEndFrom(startedAt, battle.durationSeconds),
        },
        include: BATTLE_INCLUDE,
      }),
    );

    void this.events?.notify('battle.changed', battleId);
    return toBattleView(started, userId);
  }

  /**
   * The problem for a battle, for the players in it.
   *
   * Reachable only once the battle is running and only by a participant, so
   * the bank cannot be browsed and studied in advance.
   */
  public async getBattleProblem(battleId: string, userId: string): Promise<string> {
    const battle = await withDbRetry(() =>
      this.prisma.battle.findFirst({
        where: { id: battleId },
        select: {
          problemId: true,
          state: true,
          participants: { where: { userId }, select: { id: true } },
        },
      }),
    );
    if (!battle || battle.participants.length === 0) {
      throw new NotFoundException('Battle not found');
    }
    if (!battle.problemId || isLobby(battle.state)) {
      throw new BadRequestException('This battle has not started yet');
    }
    return battle.problemId;
  }

  /** Accepts or declines an invitation. */
  public async respondToInvite(battleId: string, userId: string, accept: boolean): Promise<BattleView> {
    const battle = await withDbRetry(() =>
      this.prisma.battle.findFirst({ where: { id: battleId }, include: BATTLE_INCLUDE, relationLoadStrategy: 'join' }),
    );
    if (!battle) {
      throw new NotFoundException('Battle not found');
    }

    const me = battle.participants.find((participant) => participant.userId === userId);
    if (!me) {
      throw new NotFoundException('Battle not found');
    }
    if (me.state !== 'INVITED') {
      throw new BadRequestException('You have already responded to this invitation');
    }
    if (!isLobby(battle.state)) {
      throw new BadRequestException('This battle is no longer taking players');
    }
    if (battle.lobbyExpiresAt.getTime() <= Date.now()) {
      throw new BadRequestException('This battle expired before you could join');
    }

    if (accept) {
      const joined = battle.participants.filter((participant) => participant.state === 'JOINED').length;
      if (joined >= battle.capacity) {
        throw new ForbiddenException('This battle is full');
      }
    }

    await withDbRetry(() =>
      this.prisma.battleParticipant.update({
        where: { id: me.id },
        // joinedAt is written once and never rewritten, so leaving and
        // rejoining later cannot buy anybody a fresh clock
        data: accept ? { state: 'JOINED', joinedAt: me.joinedAt ?? new Date() } : { state: 'REJECTED' },
      }),
    );

    void this.events?.notify('battle.changed', battleId);
    return this.getBattle(battleId, userId);
  }
}

function toBattleView(
  battle: Battle & {
    participants: Array<{
      userId: string;
      state: ParticipantState;
      joinedAt: Date | null;
      isGhost: boolean;
      user: ParticipantUser;
    }>;
  },
  viewerId: string,
): BattleView {
  const me = battle.participants.find((participant) => participant.userId === viewerId);

  return {
    id: battle.id,
    visibility: battle.visibility,
    state: battle.state,
    capacity: battle.capacity,
    durationSeconds: battle.durationSeconds,
    lobbyExpiresAt: battle.lobbyExpiresAt.toISOString(),
    startedAt: battle.startedAt?.toISOString() ?? null,
    endsAt: battle.endsAt?.toISOString() ?? null,
    createdAt: battle.createdAt.toISOString(),
    difficulty: battle.difficulty,
    language: battle.language,
    problemId: battle.problemId,
    creatorId: battle.creatorId,
    participants: battle.participants.map((participant) => ({
      userId: participant.userId,
      username: participant.user.username,
      name: participant.user.name || participant.user.username,
      avatarUrl: displayAvatar(participant.user),
      state: participant.state,
      joinedAt: participant.joinedAt?.toISOString() ?? null,
      isCreator: participant.userId === battle.creatorId,
      isGhost: participant.isGhost,
    })),
    me: { state: me?.state ?? null, isCreator: battle.creatorId === viewerId },
  };
}
