import { beforeEach, describe, expect, it } from 'vitest';
import { BadRequestException, ForbiddenException, NotFoundException } from '@nestjs/common';
import { BattleService } from '../../src/modules/battles/battle.service';
import { CreatePublicBattleDto } from '../../src/modules/battles/dto/battles.dto';
import { WEEKLY_BATTLE_CREATION_LIMIT } from '../../src/modules/battles/battle.state';
import { PrismaMock, asBlocks, asEnforcement, asPrisma, createBlocksMock, createEnforcementMock, createPrismaMock } from '../helpers/mocks';

const ANN = 'u-ann';
const BOB = 'u-bob';

const user = (id: string, username: string) => ({
  id,
  username,
  name: username,
  avatarUrl: 'a.png',
  customAvatarUrl: '',
});

function publicBattle(overrides: Record<string, unknown> = {}) {
  return {
    id: 'b-1',
    creatorId: ANN,
    problemId: null,
    difficulty: 'easy',
    language: 'javascript',
    visibility: 'PUBLIC',
    state: 'OPEN',
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
      { id: 'bp-1', userId: ANN, state: 'JOINED', joinedAt: new Date(), user: user(ANN, 'ann') },
    ],
    ...overrides,
  };
}

const dto = (overrides: Partial<CreatePublicBattleDto> = {}): CreatePublicBattleDto => ({
  difficulty: 'easy',
  language: 'javascript',
  capacity: 4,
  durationSeconds: 1800,
  ...overrides,
});

describe('public battles', () => {
  let prisma: PrismaMock;
  const service = () => new BattleService(asPrisma(prisma), asBlocks(createBlocksMock()), asEnforcement(createEnforcementMock()));

  beforeEach(() => {
    prisma = createPrismaMock();
    prisma.problem.count.mockResolvedValue(9);
    prisma.battle.count.mockResolvedValue(0);
    prisma.battle.create.mockResolvedValue(publicBattle());
    prisma.battle.findFirst.mockResolvedValue(publicBattle());
  });

  describe('opening one', () => {
    it('starts with only the creator in it', async () => {
      // Nobody is invited, which is the whole point: a player with no
      // connections can still get into a battle
      await service().createPublic(ANN, dto());

      const created = prisma.battle.create.mock.calls[0][0].data;
      expect(created.visibility).toBe('PUBLIC');
      expect(created.state).toBe('OPEN');
      expect(created.participants.create).toEqual([
        expect.objectContaining({ userId: ANN, state: 'JOINED' }),
      ]);
    });

    it('still draws the problem later, not now', async () => {
      await service().createPublic(ANN, dto());
      expect(prisma.battle.create.mock.calls[0][0].data.problemId).toBeNull();
    });

    it('refuses a pool with nothing in it', async () => {
      prisma.problem.count.mockResolvedValue(0);
      await expect(service().createPublic(ANN, dto())).rejects.toBeInstanceOf(NotFoundException);
    });

    it('refuses a capacity outside the range', async () => {
      await expect(service().createPublic(ANN, dto({ capacity: 1 }))).rejects.toBeInstanceOf(
        BadRequestException,
      );
      await expect(service().createPublic(ANN, dto({ capacity: 21 }))).rejects.toBeInstanceOf(
        BadRequestException,
      );
    });
  });

  describe('the weekly creation limit', () => {
    it('lets somebody open their allowance', async () => {
      prisma.battle.count.mockResolvedValue(WEEKLY_BATTLE_CREATION_LIMIT.public - 1);
      await expect(service().createPublic(ANN, dto())).resolves.toBeTruthy();
    });

    it('refuses the one after that', async () => {
      prisma.battle.count.mockResolvedValue(WEEKLY_BATTLE_CREATION_LIMIT.public);
      await expect(service().createPublic(ANN, dto())).rejects.toBeInstanceOf(ForbiddenException);
    });

    it('counts only that person, that kind, and only this week', async () => {
      prisma.battle.count.mockResolvedValue(0);
      await service().createPublic(ANN, dto());

      const where = prisma.battle.count.mock.calls[0][0].where;
      expect(where.creatorId).toBe(ANN);
      expect(where.visibility).toBe('PUBLIC');
      // A limit that never forgets is a ban
      expect(where.createdAt.gte).toBeInstanceOf(Date);
      expect(where.createdAt.gte.getTime()).toBeLessThan(Date.now());
    });

    it('keeps the two kinds on separate allowances', async () => {
      // Opening two public battles must not stop somebody challenging a friend
      prisma.battle.count.mockResolvedValue(WEEKLY_BATTLE_CREATION_LIMIT.public);
      await expect(service().createPublic(ANN, dto())).rejects.toBeInstanceOf(ForbiddenException);

      prisma.battle.count.mockResolvedValue(0);
      await expect(service().createPublic(ANN, dto())).resolves.toBeTruthy();
      expect(prisma.battle.count.mock.calls.at(-1)?.[0].where.visibility).toBe('PUBLIC');
    });

    it('says how to keep playing anyway', async () => {
      prisma.battle.count.mockResolvedValue(WEEKLY_BATTLE_CREATION_LIMIT.public);
      await expect(service().createPublic(ANN, dto())).rejects.toThrow(/joining.*not capped/i);
    });
  });

  describe('joining one', () => {
    it('takes a seat without an invitation or a follow', async () => {
      await service().joinPublic('b-1', BOB);

      expect(prisma.battleParticipant.create.mock.calls[0][0].data).toMatchObject({
        battleId: 'b-1',
        userId: BOB,
        state: 'JOINED',
      });
    });

    it('is not an error to join twice', async () => {
      // A double click must not fail
      prisma.battle.findFirst.mockResolvedValue(
        publicBattle({
          participants: [
            { id: 'bp-1', userId: ANN, state: 'JOINED', joinedAt: new Date(), user: user(ANN, 'ann') },
            { id: 'bp-2', userId: BOB, state: 'JOINED', joinedAt: new Date(), user: user(BOB, 'bob') },
          ],
        }),
      );

      await expect(service().joinPublic('b-1', BOB)).resolves.toBeTruthy();
      expect(prisma.battleParticipant.create).not.toHaveBeenCalled();
      expect(prisma.battleParticipant.update).not.toHaveBeenCalled();
    });

    it('does not restart the clock for somebody rejoining', async () => {
      const first = new Date('2026-01-01T10:05:00Z');
      prisma.battle.findFirst.mockResolvedValue(
        publicBattle({
          participants: [
            { id: 'bp-1', userId: ANN, state: 'JOINED', joinedAt: new Date(), user: user(ANN, 'ann') },
            { id: 'bp-2', userId: BOB, state: 'LEFT', joinedAt: first, user: user(BOB, 'bob') },
          ],
        }),
      );

      await service().joinPublic('b-1', BOB);

      expect(prisma.battleParticipant.update.mock.calls[0][0].data).toEqual({
        state: 'JOINED',
        joinedAt: first,
      });
    });

    it('refuses a full lobby', async () => {
      prisma.battle.findFirst.mockResolvedValue(
        publicBattle({
          capacity: 2,
          participants: [
            { id: 'bp-1', userId: ANN, state: 'JOINED', joinedAt: new Date(), user: user(ANN, 'ann') },
            { id: 'bp-2', userId: 'u-c', state: 'JOINED', joinedAt: new Date(), user: user('u-c', 'cat') },
          ],
        }),
      );

      await expect(service().joinPublic('b-1', BOB)).rejects.toBeInstanceOf(ForbiddenException);
    });

    it('refuses a battle that has already started', async () => {
      prisma.battle.findFirst.mockResolvedValue(publicBattle({ state: 'ACTIVE' }));
      await expect(service().joinPublic('b-1', BOB)).rejects.toBeInstanceOf(BadRequestException);
    });

    it('refuses an expired lobby', async () => {
      prisma.battle.findFirst.mockResolvedValue(
        publicBattle({ lobbyExpiresAt: new Date(Date.now() - 1000) }),
      );
      await expect(service().joinPublic('b-1', BOB)).rejects.toBeInstanceOf(BadRequestException);
    });

    it('will not let anybody walk into a private battle', async () => {
      // The private path is the one that checks who follows whom
      prisma.battle.findFirst.mockResolvedValue(publicBattle({ visibility: 'PRIVATE' }));
      await expect(service().joinPublic('b-1', BOB)).rejects.toBeInstanceOf(NotFoundException);
    });
  });

  describe('the lobby list', () => {
    const lobbyRow = (overrides: Record<string, unknown> = {}) => ({
      id: 'b-1',
      difficulty: 'easy',
      language: 'javascript',
      capacity: 4,
      durationSeconds: 1800,
      lobbyExpiresAt: new Date('2026-01-01T14:00:00Z'),
      createdAt: new Date('2026-01-01T10:00:00Z'),
      creator: { username: 'ann', name: 'Ann', avatarUrl: 'a.png', customAvatarUrl: '' },
      participants: [
        { userId: ANN, state: 'JOINED' },
        { userId: 'u-c', state: 'JOINED' },
      ],
      ...overrides,
    });

    it('reports how many have joined, not how many rows exist', async () => {
      prisma.battle.findMany.mockResolvedValue([
        lobbyRow({
          participants: [
            { userId: ANN, state: 'JOINED' },
            { userId: BOB, state: 'LEFT' },
          ],
        }),
      ]);

      const [lobby] = await service().listOpenLobbies(BOB);
      expect(lobby.joined).toBe(1);
      expect(lobby.capacity).toBe(4);
    });

    it('marks the ones the caller is already in', async () => {
      prisma.battle.findMany.mockResolvedValue([
        lobbyRow(),
        lobbyRow({ id: 'b-2', participants: [{ userId: BOB, state: 'JOINED' }] }),
      ]);

      const lobbies = await service().listOpenLobbies(BOB);
      expect(lobbies.map((l) => l.joinedByMe)).toEqual([false, true]);
    });

    it('asks only for public lobbies that are still open and unexpired', async () => {
      prisma.battle.findMany.mockResolvedValue([]);
      await service().listOpenLobbies(BOB);

      const where = prisma.battle.findMany.mock.calls[0][0].where;
      expect(where.visibility).toBe('PUBLIC');
      expect(where.state).toBe('OPEN');
      // A dead lobby in the list is a dead end for whoever clicks it
      expect(where.lobbyExpiresAt.gt).toBeInstanceOf(Date);
    });

    it('is empty rather than an error when nothing is open', async () => {
      prisma.battle.findMany.mockResolvedValue([]);
      await expect(service().listOpenLobbies(BOB)).resolves.toEqual([]);
    });
  });
});
