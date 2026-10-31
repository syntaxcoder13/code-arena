import { beforeEach, describe, expect, it } from 'vitest';
import { BadRequestException, NotFoundException } from '@nestjs/common';
import { BlockService } from '../../src/modules/moderation/block.service';
import { asPrisma, createPrismaMock, PrismaMock } from '../helpers/mocks';

const ME = 'u-me';
const THEM = 'u-them';

const user = (id: string, username: string) => ({
  id,
  username,
  name: username,
  avatarUrl: 'a.png',
  customAvatarUrl: '',
});

describe('BlockService', () => {
  let prisma: PrismaMock;
  const service = () => new BlockService(asPrisma(prisma));

  beforeEach(() => {
    prisma = createPrismaMock();
    prisma.user.findUnique.mockResolvedValue(user(THEM, 'them'));
    prisma.userBlock.upsert.mockResolvedValue({ kind: 'BLOCK', createdAt: new Date() });
    prisma.userBlock.deleteMany.mockResolvedValue({ count: 1 });
  });

  describe('setting one', () => {
    it('records a block against that person', async () => {
      await service().set(ME, 'them', 'BLOCK');

      const call = prisma.userBlock.upsert.mock.calls[0][0];
      expect(call.create).toMatchObject({ blockerId: ME, blockedId: THEM, kind: 'BLOCK' });
    });

    it('is an update rather than a second row when clicked twice', async () => {
      // A double click must not be two blocks, and moving from mute to block
      // must not leave the mute behind
      await service().set(ME, 'them', 'MUTE');

      const call = prisma.userBlock.upsert.mock.calls[0][0];
      expect(call.where.blockerId_blockedId).toEqual({ blockerId: ME, blockedId: THEM });
      expect(call.update).toEqual({ kind: 'MUTE' });
    });

    it('unfollows in both directions when blocking', async () => {
      // Leaving the follow would keep feeding their activity into a feed the
      // viewer has just said they do not want
      await service().set(ME, 'them', 'BLOCK');

      expect(prisma.follow.deleteMany.mock.calls[0][0].where.OR).toEqual([
        { followerId: ME, followingId: THEM },
        { followerId: THEM, followingId: ME },
      ]);
    });

    it('leaves the follow alone for a mute', async () => {
      // A mute is about noise, not about the relationship
      prisma.userBlock.upsert.mockResolvedValue({ kind: 'MUTE', createdAt: new Date() });
      await service().set(ME, 'them', 'MUTE');

      expect(prisma.follow.deleteMany).not.toHaveBeenCalled();
    });

    it('refuses to block yourself', async () => {
      prisma.user.findUnique.mockResolvedValue(user(ME, 'me'));
      await expect(service().set(ME, 'me', 'BLOCK')).rejects.toBeInstanceOf(BadRequestException);
    });

    it('refuses somebody who is not here', async () => {
      prisma.user.findUnique.mockResolvedValue(null);
      await expect(service().set(ME, 'ghosty', 'BLOCK')).rejects.toBeInstanceOf(NotFoundException);
    });
  });

  describe('lifting one', () => {
    it('removes only the caller’s own row', async () => {
      await service().clear(ME, 'them');

      expect(prisma.userBlock.deleteMany.mock.calls[0][0].where).toEqual({
        blockerId: ME,
        blockedId: THEM,
      });
    });

    it('is not an error when there was nothing to lift', async () => {
      prisma.userBlock.deleteMany.mockResolvedValue({ count: 0 });
      await expect(service().clear(ME, 'them')).resolves.toEqual({ cleared: false });
    });
  });

  describe('how two people stand', () => {
    it('reads both directions in one query', async () => {
      prisma.userBlock.findMany.mockResolvedValue([]);
      await service().between(ME, THEM);

      expect(prisma.userBlock.findMany.mock.calls[0][0].where.OR).toEqual([
        { blockerId: ME, blockedId: THEM },
        { blockerId: THEM, blockedId: ME },
      ]);
    });

    it('tells the two directions apart', async () => {
      prisma.userBlock.findMany.mockResolvedValue([{ blockerId: THEM, kind: 'BLOCK' }]);

      const standing = await service().between(ME, THEM);
      expect(standing).toMatchObject({
        iBlockedThem: false,
        theyBlockedMe: true,
        // Both sides are barred either way, which is what callers act on
        blocked: true,
      });
    });

    it('does not treat a mute as a block', async () => {
      // A mute quietens a conversation; it is not a reason to keep two
      // people out of the same battle
      prisma.userBlock.findMany.mockResolvedValue([{ blockerId: ME, kind: 'MUTE' }]);

      const standing = await service().between(ME, THEM);
      expect(standing).toMatchObject({ iMutedThem: true, iBlockedThem: false, blocked: false });
    });

    it('is nothing at all against yourself, without asking the database', async () => {
      const standing = await service().between(ME, ME);

      expect(standing.blocked).toBe(false);
      expect(prisma.userBlock.findMany).not.toHaveBeenCalled();
    });
  });

  describe('the barred list', () => {
    it('collects both directions into the other person’s id', async () => {
      prisma.userBlock.findMany.mockResolvedValue([
        { blockerId: ME, blockedId: 'u-a' },
        { blockerId: 'u-b', blockedId: ME },
      ]);

      expect((await service().blockedIds(ME)).sort()).toEqual(['u-a', 'u-b']);
    });

    it('asks only for blocks, never mutes', async () => {
      await service().blockedIds(ME);
      expect(prisma.userBlock.findMany.mock.calls[0][0].where.kind).toBe('BLOCK');
    });

    it('counts a pair once even if blocked both ways', async () => {
      prisma.userBlock.findMany.mockResolvedValue([
        { blockerId: ME, blockedId: THEM },
        { blockerId: THEM, blockedId: ME },
      ]);

      expect(await service().blockedIds(ME)).toEqual([THEM]);
    });
  });

  describe('mutes within a list', () => {
    it('does not query at all for an empty list', async () => {
      expect(await service().mutedAmong(ME, [])).toEqual(new Set());
      expect(prisma.userBlock.findMany).not.toHaveBeenCalled();
    });

    it('returns only the ones the caller muted', async () => {
      prisma.userBlock.findMany.mockResolvedValue([{ blockedId: 'u-a' }]);

      const muted = await service().mutedAmong(ME, ['u-a', 'u-b']);
      expect(muted.has('u-a')).toBe(true);
      expect(muted.has('u-b')).toBe(false);
      expect(prisma.userBlock.findMany.mock.calls[0][0].where).toMatchObject({
        blockerId: ME,
        kind: 'MUTE',
      });
    });
  });
});
