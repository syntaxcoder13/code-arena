import { beforeEach, describe, expect, it, vi } from 'vitest';
import { ForbiddenException } from '@nestjs/common';
import { ChatService } from '../../src/modules/chat/chat.service';
import { BattleService } from '../../src/modules/battles/battle.service';
import { GhostService } from '../../src/modules/battles/ghost.service';
import { BlockService } from '../../src/modules/moderation/block.service';
import { PrismaMock, asEnforcement, asPrisma, createEnforcementMock, createPrismaMock } from '../helpers/mocks';

const ME = 'u-me';
const THEM = 'u-them';

const clear = { iBlockedThem: false, theyBlockedMe: false, iMutedThem: false, blocked: false };

/** A BlockService stub, so these tests are about the wiring and nothing else. */
function stubBlocks(overrides: Partial<Record<keyof BlockService, unknown>> = {}) {
  return {
    between: vi.fn().mockResolvedValue(clear),
    blockedIds: vi.fn().mockResolvedValue([]),
    mutedAmong: vi.fn().mockResolvedValue(new Set()),
    ...overrides,
  } as unknown as BlockService;
}

const barred = { ...clear, theyBlockedMe: true, blocked: true };

describe('chat across a block', () => {
  let prisma: PrismaMock;

  beforeEach(() => {
    prisma = createPrismaMock();
    prisma.user.findFirst.mockResolvedValue({
      id: THEM,
      username: 'them',
      name: 'Them',
      avatarUrl: '',
      customAvatarUrl: '',
      bio: '',
    });
    prisma.conversation.findUnique.mockResolvedValue({ id: 'c-1', userAId: ME, userBId: THEM });
    prisma.conversation.upsert.mockResolvedValue({ id: 'c-1', lastMessageAt: new Date() });
  });

  it('will not open a conversation', async () => {
    const chat = new ChatService(asPrisma(prisma), stubBlocks({ between: vi.fn().mockResolvedValue(barred) }));

    await expect(chat.startConversation(ME, 'them')).rejects.toBeInstanceOf(ForbiddenException);
    expect(prisma.conversation.upsert).not.toHaveBeenCalled();
  });

  it('refuses whichever side set it, in the same words', async () => {
    // A person who has been blocked is not told that they have been
    const mine = new ChatService(
      asPrisma(prisma),
      stubBlocks({ between: vi.fn().mockResolvedValue({ ...clear, iBlockedThem: true, blocked: true }) }),
    );
    const theirs = new ChatService(
      asPrisma(prisma),
      stubBlocks({ between: vi.fn().mockResolvedValue(barred) }),
    );

    const [a, b] = await Promise.all([
      mine.startConversation(ME, 'them').catch((e: Error) => e.message),
      theirs.startConversation(ME, 'them').catch((e: Error) => e.message),
    ]);
    expect(a).toBe(b);
  });

  it('will not send, checked on every message and not just at the start', async () => {
    // A block is usually set in the middle of a conversation
    const chat = new ChatService(asPrisma(prisma), stubBlocks({ between: vi.fn().mockResolvedValue(barred) }));

    await expect(chat.sendMessage('c-1', ME, { content: 'hello' })).rejects.toBeInstanceOf(
      ForbiddenException,
    );
    expect(prisma.message.create).not.toHaveBeenCalled();
  });

  describe('the conversation list', () => {
    beforeEach(() => {
      prisma.conversation.findMany.mockResolvedValue([
        {
          id: 'c-1',
          userAId: ME,
          userBId: THEM,
          lastMessageAt: new Date(),
          userA: { id: ME, username: 'me', name: 'Me', avatarUrl: '', customAvatarUrl: '', bio: '' },
          userB: { id: THEM, username: 'them', name: 'Them', avatarUrl: '', customAvatarUrl: '', bio: '' },
          messages: [{ body: 'hi', codeSnippet: '' }],
          _count: { messages: 4 },
        },
      ]);
    });

    it('drops a blocked conversation entirely', async () => {
      const chat = new ChatService(
        asPrisma(prisma),
        stubBlocks({ blockedIds: vi.fn().mockResolvedValue([THEM]) }),
      );

      expect(await chat.listConversations(ME)).toEqual([]);
    });

    it('keeps a muted one but stops it asking for attention', async () => {
      const chat = new ChatService(
        asPrisma(prisma),
        stubBlocks({ mutedAmong: vi.fn().mockResolvedValue(new Set([THEM])) }),
      );

      const [conversation] = await chat.listConversations(ME);
      expect(conversation.muted).toBe(true);
      expect(conversation.unreadCount).toBe(0);
      // The messages are still there to read
      expect(conversation.lastMessage).toBe('hi');
    });

    it('leaves an ordinary conversation counting normally', async () => {
      const chat = new ChatService(asPrisma(prisma), stubBlocks());

      const [conversation] = await chat.listConversations(ME);
      expect(conversation.unreadCount).toBe(4);
      expect(conversation.muted).toBe(false);
    });
  });
});

describe('battles across a block', () => {
  let prisma: PrismaMock;

  const lobby = (participants: { userId: string; state: string }[]) => ({
    id: 'b-1',
    creatorId: 'u-host',
    problemId: null,
    difficulty: 'easy',
    language: 'javascript',
    visibility: 'PUBLIC',
    state: 'OPEN',
    capacity: 4,
    durationSeconds: 1800,
    lobbyExpiresAt: new Date(Date.now() + 3600_000),
    startedAt: null,
    endsAt: null,
    completedAt: null,
    finalPlayerCount: null,
    createdAt: new Date(),
    updatedAt: new Date(),
    participants: participants.map((p, i) => ({
      id: `bp-${i}`,
      ...p,
      joinedAt: new Date(),
      user: { id: p.userId, username: p.userId, name: p.userId, avatarUrl: '', customAvatarUrl: '' },
    })),
  });

  beforeEach(() => {
    prisma = createPrismaMock();
    prisma.problem.count.mockResolvedValue(9);
  });

  it('will not let somebody join a lobby a blocked person is sitting in', async () => {
    prisma.battle.findFirst.mockResolvedValue(lobby([{ userId: THEM, state: 'JOINED' }]));
    const battles = new BattleService(
      asPrisma(prisma),
      stubBlocks({ blockedIds: vi.fn().mockResolvedValue([THEM]) }),
      asEnforcement(createEnforcementMock()),
    );

    await expect(battles.joinPublic('b-1', ME)).rejects.toBeInstanceOf(ForbiddenException);
    expect(prisma.battleParticipant.create).not.toHaveBeenCalled();
  });

  it('lets them join one without them in it', async () => {
    prisma.battle.findFirst.mockResolvedValue(lobby([{ userId: 'u-host', state: 'JOINED' }]));
    const battles = new BattleService(
      asPrisma(prisma),
      stubBlocks({ blockedIds: vi.fn().mockResolvedValue([THEM]) }),
      asEnforcement(createEnforcementMock()),
    );

    await battles.joinPublic('b-1', ME);
    expect(prisma.battleParticipant.create).toHaveBeenCalled();
  });

  it('hides such a lobby from the open list in the first place', async () => {
    // Offering a lobby that cannot be joined is a dead end
    prisma.battle.findMany.mockResolvedValue([
      {
        id: 'b-1',
        difficulty: 'easy',
        language: 'javascript',
        capacity: 4,
        durationSeconds: 1800,
        lobbyExpiresAt: new Date(),
        createdAt: new Date(),
        creator: { username: 'them', name: 'Them', avatarUrl: '', customAvatarUrl: '' },
        participants: [{ userId: THEM, state: 'JOINED' }],
      },
    ]);
    const battles = new BattleService(
      asPrisma(prisma),
      stubBlocks({ blockedIds: vi.fn().mockResolvedValue([THEM]) }),
      asEnforcement(createEnforcementMock()),
    );

    expect(await battles.listOpenLobbies(ME)).toEqual([]);
  });

  it('never draws a blocked person as a ghost', async () => {
    // A ghost is still that person's code with their name on it
    prisma.submission.findMany.mockResolvedValue([]);
    const ghosts = new GhostService(
      asPrisma(prisma),
      stubBlocks({ blockedIds: vi.fn().mockResolvedValue([THEM]) }),
      asEnforcement(createEnforcementMock()),
    );

    await ghosts.start(ME, 'easy', 'javascript', 1800).catch(() => undefined);

    const where = prisma.submission.findMany.mock.calls[0][0].where;
    expect(where.participant.userId).toEqual({ notIn: [ME, THEM] });
  });
});
