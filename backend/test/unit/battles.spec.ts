import { beforeEach, describe, expect, it } from 'vitest';
import { BadRequestException, ForbiddenException, NotFoundException } from '@nestjs/common';
import { BattleService } from '../../src/modules/battles/battle.service';
import { CreatePrivateBattleDto } from '../../src/modules/battles/dto/battles.dto';
import { PrismaMock, asBlocks, asEnforcement, asPrisma, createBlocksMock, createEnforcementMock, createPrismaMock } from '../helpers/mocks';

const VIKRANT = 'u-vikrant';
const VRUSHALI = 'u-vrushali';
const STRANGER = 'u-stranger';

const user = (id: string, username: string) => ({
  id,
  username,
  name: username,
  avatarUrl: 'a.png',
  customAvatarUrl: '',
});

/** A user row as the invitee lookup returns it: followed by the creator. */
const followedUser = (id: string, username: string) => ({
  ...user(id, username),
  followersRelation: [{ id: 'f-1' }],
});

/** The same row for someone the creator does not follow. */
const unfollowedUser = (id: string, username: string) => ({
  ...user(id, username),
  followersRelation: [],
});

function battleRow(overrides: Record<string, unknown> = {}) {
  return {
    id: 'b-1',
    creatorId: VIKRANT,
    problemId: null,
    difficulty: 'easy',
    language: 'javascript',
    visibility: 'PRIVATE',
    state: 'INVITED',
    capacity: 2,
    durationSeconds: 1800,
    lobbyExpiresAt: new Date(Date.now() + 3 * 60 * 60 * 1000),
    startedAt: null,
    endsAt: null,
    completedAt: null,
    finalPlayerCount: null,
    createdAt: new Date('2026-01-01T10:00:00Z'),
    updatedAt: new Date('2026-01-01T10:00:00Z'),
    participants: [
      { id: 'bp-1', userId: VIKRANT, state: 'JOINED', joinedAt: new Date(), user: user(VIKRANT, 'vikrant') },
      { id: 'bp-2', userId: VRUSHALI, state: 'INVITED', joinedAt: null, user: user(VRUSHALI, 'vrushali') },
    ],
    ...overrides,
  };
}

const dto = (overrides: Partial<CreatePrivateBattleDto> = {}): CreatePrivateBattleDto => ({
  difficulty: 'easy',
  language: 'javascript',
  capacity: 2,
  durationSeconds: 1800,
  invitees: ['vrushali'],
  ...overrides,
});

describe('BattleService', () => {
  let prisma: PrismaMock;
  const service = () => new BattleService(asPrisma(prisma), asBlocks(createBlocksMock()), asEnforcement(createEnforcementMock()));

  beforeEach(() => {
    prisma = createPrismaMock();
    prisma.problem.count.mockResolvedValue(3);
    prisma.problem.findMany.mockResolvedValue([{ id: 'p-1' }, { id: 'p-2' }, { id: 'p-3' }]);
    prisma.user.findMany.mockResolvedValue([followedUser(VRUSHALI, 'vrushali')]);
    prisma.battle.create.mockResolvedValue(battleRow());
    prisma.battle.findFirst.mockResolvedValue(battleRow());
  });

  describe('creating a private battle', () => {
    it('opens the lobby with the creator in and the invitee pending', async () => {
      const battle = await service().createPrivate(VIKRANT, dto());

      const created = prisma.battle.create.mock.calls[0][0].data;
      expect(created.state).toBe('INVITED');
      expect(created.visibility).toBe('PRIVATE');
      expect(created.participants.create).toEqual([
        expect.objectContaining({ userId: VIKRANT, state: 'JOINED' }),
        expect.objectContaining({ userId: VRUSHALI, state: 'INVITED' }),
      ]);
      expect(battle.me.isCreator).toBe(true);
    });

    it('sets the lobby to expire four hours out', async () => {
      await service().createPrivate(VIKRANT, dto());

      const { lobbyExpiresAt } = prisma.battle.create.mock.calls[0][0].data;
      const hoursAway = (lobbyExpiresAt.getTime() - Date.now()) / (60 * 60 * 1000);
      expect(hoursAway).toBeGreaterThan(3.9);
      expect(hoursAway).toBeLessThan(4.1);
    });

    it('refuses to invite someone the creator does not follow', async () => {
      prisma.user.findMany.mockResolvedValue([unfollowedUser(VRUSHALI, 'vrushali')]);

      // This is what keeps a private battle from being a way to reach strangers
      await expect(service().createPrivate(VIKRANT, dto())).rejects.toBeInstanceOf(BadRequestException);
      expect(prisma.battle.create).not.toHaveBeenCalled();
    });

    it('refuses an invitee who is not on OpenSourceHub', async () => {
      prisma.user.findMany.mockResolvedValue([]);
      await expect(service().createPrivate(VIKRANT, dto({ invitees: ['ghost'] }))).rejects.toBeInstanceOf(
        NotFoundException,
      );
    });

    it('refuses to let the creator invite themselves', async () => {
      prisma.user.findMany.mockResolvedValue([followedUser(VIKRANT, 'vikrant')]);
      await expect(service().createPrivate(VIKRANT, dto({ invitees: ['vikrant'] }))).rejects.toBeInstanceOf(
        BadRequestException,
      );
    });

    it('refuses more invitees than there are seats', async () => {
      // Two seats means the creator plus one other
      await expect(
        service().createPrivate(VIKRANT, dto({ capacity: 2, invitees: ['vrushali', 'someone'] })),
      ).rejects.toBeInstanceOf(BadRequestException);
    });

    it('treats @name, casing and duplicates as one invitee', async () => {
      await service().createPrivate(VIKRANT, dto({ invitees: ['@Vrushali', 'vrushali', 'VRUSHALI'] }));

      expect(prisma.user.findMany.mock.calls[0][0].where.username.in).toEqual(['vrushali']);
    });

    it('checks the follow in the same query, scoped to the creator', async () => {
      await service().createPrivate(VIKRANT, dto());

      // One round trip instead of two: the pooled database allows only a few
      expect(prisma.user.findMany.mock.calls[0][0].select.followersRelation.where).toEqual({
        followerId: VIKRANT,
      });
      expect(prisma.follow.findMany).not.toHaveBeenCalled();
    });

    it('does not leak the follow rows into the created participants', async () => {
      await service().createPrivate(VIKRANT, dto());

      const invited = prisma.battle.create.mock.calls[0][0].data.participants.create[1];
      expect(Object.keys(invited)).toEqual(['userId', 'state']);
    });

    it('refuses a capacity or duration outside the offered range', async () => {
      await expect(service().createPrivate(VIKRANT, dto({ capacity: 25 }))).rejects.toBeInstanceOf(
        BadRequestException,
      );
      await expect(service().createPrivate(VIKRANT, dto({ capacity: 1 }))).rejects.toBeInstanceOf(
        BadRequestException,
      );
      await expect(service().createPrivate(VIKRANT, dto({ durationSeconds: 61 }))).rejects.toBeInstanceOf(
        BadRequestException,
      );
    });

    it('stores the pool and leaves the problem undrawn', async () => {
      await service().createPrivate(VIKRANT, dto());

      const created = prisma.battle.create.mock.calls[0][0].data;
      // Nobody - the creator included - knows the problem while the lobby fills
      expect(created.problemId).toBeNull();
      expect(created.difficulty).toBe('easy');
      expect(created.language).toBe('javascript');
    });

    it('refuses a pool with no problems behind it', async () => {
      prisma.problem.count.mockResolvedValue(0);
      await expect(service().createPrivate(VIKRANT, dto())).rejects.toBeInstanceOf(NotFoundException);
      expect(prisma.battle.create).not.toHaveBeenCalled();
    });

    it('refuses a difficulty that is not offered', async () => {
      await expect(service().createPrivate(VIKRANT, dto({ difficulty: 'impossible' }))).rejects.toBeInstanceOf(
        BadRequestException,
      );
    });

    it('normalises the language before looking for a pool', async () => {
      await service().createPrivate(VIKRANT, dto({ language: '  JavaScript  ' }));

      expect(prisma.problem.count.mock.calls[0][0].where).toEqual({
        reviewed: true,
        difficulty: 'easy',
        language: 'javascript',
      });
    });
  });

  describe('what the lobby shows', () => {
    it('shows the pool but no problem at all while waiting', async () => {
      const battle = await service().getBattle('b-1', VRUSHALI);

      expect(battle.difficulty).toBe('easy');
      expect(battle.language).toBe('javascript');
      // Drawn at start, so there is nothing here for anyone to prepare against
      expect(battle.problemId).toBeNull();
    });

    it('lists both players and marks the creator', async () => {
      const battle = await service().getBattle('b-1', VRUSHALI);

      expect(battle.participants.map((p) => [p.username, p.state, p.isCreator])).toEqual([
        ['vikrant', 'JOINED', true],
        ['vrushali', 'INVITED', false],
      ]);
      expect(battle.me).toEqual({ state: 'INVITED', isCreator: false });
    });
  });

  describe('authorization', () => {
    it('hides a private battle from everyone who is not in it', async () => {
      // 404 rather than 403: confirming the id exists is itself a leak
      await expect(service().getBattle('b-1', STRANGER)).rejects.toBeInstanceOf(NotFoundException);
    });

    it('answers 404 for a battle that does not exist', async () => {
      prisma.battle.findFirst.mockResolvedValue(null);
      await expect(service().getBattle('b-nope', VIKRANT)).rejects.toBeInstanceOf(NotFoundException);
    });

    it('lets any signed-in user see a public lobby', async () => {
      prisma.battle.findFirst.mockResolvedValue(battleRow({ visibility: 'PUBLIC', state: 'OPEN' }));

      const battle = await service().getBattle('b-1', STRANGER);
      expect(battle.me).toEqual({ state: null, isCreator: false });
    });

    it('closes a public battle again once it is running', async () => {
      prisma.battle.findFirst.mockResolvedValue(battleRow({ visibility: 'PUBLIC', state: 'ACTIVE' }));
      await expect(service().getBattle('b-1', STRANGER)).rejects.toBeInstanceOf(NotFoundException);
    });

    it('only lists battles the caller is part of, and never as a ghost', async () => {
      prisma.battle.findMany.mockResolvedValue([]);
      await service().listMine(VRUSHALI);

      // A ghost is a copy of somebody's old code standing in as an opponent.
      // Their own list must not fill with battles they were never in.
      expect(prisma.battle.findMany.mock.calls[0][0].where).toEqual({
        participants: { some: { userId: VRUSHALI, isGhost: false } },
      });
    });
  });

  describe('starting the battle', () => {
    const readyBattle = (overrides: Record<string, unknown> = {}) =>
      battleRow({
        participants: [
          { id: 'bp-1', userId: VIKRANT, state: 'JOINED', joinedAt: new Date(), user: user(VIKRANT, 'vikrant') },
          { id: 'bp-2', userId: VRUSHALI, state: 'JOINED', joinedAt: new Date(), user: user(VRUSHALI, 'vrushali') },
        ],
        ...overrides,
      });

    beforeEach(() => {
      prisma.battle.findFirst.mockResolvedValue(readyBattle());
      prisma.battle.update.mockImplementation(async ({ data }) =>
        readyBattle({ state: 'ACTIVE', ...data }),
      );
    });

    it('draws the problem from the pool only now', async () => {
      await service().startBattle('b-1', VIKRANT);

      // The pool query happens at start, never at creation
      expect(prisma.problem.findMany.mock.calls[0][0].where).toEqual({
        reviewed: true,
        difficulty: 'easy',
        language: 'javascript',
      });
      expect(['p-1', 'p-2', 'p-3']).toContain(prisma.battle.update.mock.calls[0][0].data.problemId);
    });

    it('gives every player the same deadline', async () => {
      await service().startBattle('b-1', VIKRANT);

      const { startedAt, endsAt, state } = prisma.battle.update.mock.calls[0][0].data;
      expect(state).toBe('ACTIVE');
      // One shared clock: 30 minutes from the moment Start was pressed
      expect(endsAt.getTime() - startedAt.getTime()).toBe(30 * 60 * 1000);
    });

    it('lets only the creator start it', async () => {
      await expect(service().startBattle('b-1', VRUSHALI)).rejects.toBeInstanceOf(ForbiddenException);
      expect(prisma.battle.update).not.toHaveBeenCalled();
    });

    it('hides the battle from someone who is not in it', async () => {
      await expect(service().startBattle('b-1', STRANGER)).rejects.toBeInstanceOf(NotFoundException);
    });

    it('refuses to start with only one player', async () => {
      prisma.battle.findFirst.mockResolvedValue(
        battleRow({
          participants: [
            { id: 'bp-1', userId: VIKRANT, state: 'JOINED', joinedAt: new Date(), user: user(VIKRANT, 'vikrant') },
            { id: 'bp-2', userId: VRUSHALI, state: 'INVITED', joinedAt: null, user: user(VRUSHALI, 'vrushali') },
          ],
        }),
      );

      // Starting alone would be a free win for whoever opened the battle
      await expect(service().startBattle('b-1', VIKRANT)).rejects.toBeInstanceOf(BadRequestException);
    });

    it('refuses to start a battle twice', async () => {
      prisma.battle.findFirst.mockResolvedValue(readyBattle({ state: 'ACTIVE' }));
      await expect(service().startBattle('b-1', VIKRANT)).rejects.toBeInstanceOf(BadRequestException);
    });

    it('refuses to start an expired lobby', async () => {
      prisma.battle.findFirst.mockResolvedValue(readyBattle({ lobbyExpiresAt: new Date(Date.now() - 1000) }));
      await expect(service().startBattle('b-1', VIKRANT)).rejects.toBeInstanceOf(BadRequestException);
    });

    it('refuses to start when the pool has emptied since creation', async () => {
      prisma.problem.findMany.mockResolvedValue([]);
      await expect(service().startBattle('b-1', VIKRANT)).rejects.toBeInstanceOf(NotFoundException);
    });
  });

  describe('reaching the problem', () => {
    it('hands back the problem id once the battle is running', async () => {
      prisma.battle.findFirst.mockResolvedValue({
        problemId: 'p-2',
        state: 'ACTIVE',
        participants: [{ id: 'bp-2' }],
      });

      await expect(service().getBattleProblem('b-1', VRUSHALI)).resolves.toBe('p-2');
    });

    it('refuses while the battle is still a lobby', async () => {
      prisma.battle.findFirst.mockResolvedValue({
        problemId: null,
        state: 'INVITED',
        participants: [{ id: 'bp-2' }],
      });

      await expect(service().getBattleProblem('b-1', VRUSHALI)).rejects.toBeInstanceOf(BadRequestException);
    });

    it('hides it from someone who is not in the battle', async () => {
      prisma.battle.findFirst.mockResolvedValue({ problemId: 'p-2', state: 'ACTIVE', participants: [] });

      // This is the only route to a problem, so it is also what stops the
      // bank being browsed and studied in advance
      await expect(service().getBattleProblem('b-1', STRANGER)).rejects.toBeInstanceOf(NotFoundException);
    });
  });

  describe('responding to an invitation', () => {
    it('accepting puts the invitee in and stamps their join time', async () => {
      await service().respondToInvite('b-1', VRUSHALI, true);

      const update = prisma.battleParticipant.update.mock.calls[0][0];
      expect(update.where).toEqual({ id: 'bp-2' });
      expect(update.data.state).toBe('JOINED');
      expect(update.data.joinedAt).toBeInstanceOf(Date);
    });

    it('rejecting records the refusal without a join time', async () => {
      await service().respondToInvite('b-1', VRUSHALI, false);

      expect(prisma.battleParticipant.update.mock.calls[0][0].data).toEqual({ state: 'REJECTED' });
    });

    it('never rewrites an existing join time', async () => {
      const firstJoin = new Date('2026-01-01T10:40:00Z');
      prisma.battle.findFirst.mockResolvedValue(
        battleRow({
          participants: [
            { id: 'bp-1', userId: VIKRANT, state: 'JOINED', joinedAt: new Date(), user: user(VIKRANT, 'vikrant') },
            { id: 'bp-2', userId: VRUSHALI, state: 'INVITED', joinedAt: firstJoin, user: user(VRUSHALI, 'vrushali') },
          ],
        }),
      );

      await service().respondToInvite('b-1', VRUSHALI, true);

      // Rejoining must not buy a fresh clock
      expect(prisma.battleParticipant.update.mock.calls[0][0].data.joinedAt).toBe(firstJoin);
    });

    it('refuses a second response', async () => {
      prisma.battle.findFirst.mockResolvedValue(
        battleRow({
          participants: [
            { id: 'bp-1', userId: VIKRANT, state: 'JOINED', joinedAt: new Date(), user: user(VIKRANT, 'vikrant') },
            { id: 'bp-2', userId: VRUSHALI, state: 'JOINED', joinedAt: new Date(), user: user(VRUSHALI, 'vrushali') },
          ],
        }),
      );
      await expect(service().respondToInvite('b-1', VRUSHALI, true)).rejects.toBeInstanceOf(BadRequestException);
    });

    it('refuses an invitation to a battle that already expired', async () => {
      prisma.battle.findFirst.mockResolvedValue(
        battleRow({ lobbyExpiresAt: new Date(Date.now() - 1000) }),
      );
      await expect(service().respondToInvite('b-1', VRUSHALI, true)).rejects.toBeInstanceOf(BadRequestException);
    });

    it('refuses an invitation to a battle that is no longer a lobby', async () => {
      prisma.battle.findFirst.mockResolvedValue(battleRow({ state: 'ACTIVE' }));
      await expect(service().respondToInvite('b-1', VRUSHALI, true)).rejects.toBeInstanceOf(BadRequestException);
    });

    it('refuses to seat more players than the battle holds', async () => {
      prisma.battle.findFirst.mockResolvedValue(
        battleRow({
          capacity: 2,
          participants: [
            { id: 'bp-1', userId: VIKRANT, state: 'JOINED', joinedAt: new Date(), user: user(VIKRANT, 'vikrant') },
            { id: 'bp-3', userId: 'u-third', state: 'JOINED', joinedAt: new Date(), user: user('u-third', 'third') },
            { id: 'bp-2', userId: VRUSHALI, state: 'INVITED', joinedAt: null, user: user(VRUSHALI, 'vrushali') },
          ],
        }),
      );
      await expect(service().respondToInvite('b-1', VRUSHALI, true)).rejects.toBeInstanceOf(ForbiddenException);
    });

    it('hides the invitation from someone who was never invited', async () => {
      await expect(service().respondToInvite('b-1', STRANGER, true)).rejects.toBeInstanceOf(NotFoundException);
    });
  });
});
