import { beforeEach, describe, expect, it, vi } from 'vitest';
import { BadRequestException, NotFoundException } from '@nestjs/common';
import { ChatService } from '../../src/modules/chat/chat.service';
import type { PrismaService } from '../../src/database/prisma.service';
import { asBlocks, createBlocksMock } from '../helpers/mocks';

/**
 * The chat rules are about how rows relate to each other, so these tests run
 * against a small in-memory stand-in for the two tables rather than against
 * assertion-only mocks: a test can send a real message and read it back.
 */
interface Row {
  [key: string]: unknown;
}

function createChatStore() {
  const users: Row[] = [
    { id: 'u-vrushali', username: 'vrushali', name: 'Vrushali', avatarUrl: 'a.png', customAvatarUrl: '', bio: 'Rust' },
    { id: 'u-vikrant', username: 'vikrant', name: 'Vikrant', avatarUrl: 'b.png', customAvatarUrl: '', bio: 'TS' },
    { id: 'u-nosy', username: 'nosy', name: 'Nosy Parker', avatarUrl: 'c.png', customAvatarUrl: '', bio: '' },
  ];
  const conversations: Row[] = [];
  const messages: Row[] = [];
  let clock = 1_700_000_000_000;
  const nextDate = () => new Date((clock += 1000));

  const matches = (row: Row, where: Row): boolean =>
    Object.entries(where).every(([key, value]) => {
      if (key === 'AND') return (value as Row[]).every(clause => matches(row, clause));
      if (key === 'OR') return (value as Row[]).some((clause) => matches(row, clause));
      if (key === 'NOT') return !matches(row, value as Row);
      if (value && typeof value === 'object' && !(value instanceof Date)) {
        const condition = value as Row;
        if ('equals' in condition) return condition.mode === 'insensitive' ? String(row[key]).toLowerCase() === String(condition.equals).toLowerCase() : row[key] === condition.equals;
        if ('in' in condition) return (condition.in as unknown[]).includes(row[key]);
        if ('not' in condition) return row[key] !== condition.not;
        if ('lt' in condition) return (row[key] as Date) < (condition.lt as Date);
        if ('gt' in condition) return (row[key] as Date) > (condition.gt as Date);
      }
      return value instanceof Date ? (row[key] as Date).getTime() === value.getTime() : row[key] === value;
    });

  const withSender = (message: Row): Row => ({
    ...message,
    sender: users.find((u) => u.id === message.senderId),
    replyTo: message.replyToId
      ? (() => {
          const target = messages.find((m) => m.id === message.replyToId)!;
          return { ...target, sender: users.find((u) => u.id === target.senderId) };
        })()
      : null,
  });

  const prisma = {
    user: {
      findUnique: async ({ where }: { where: Row }) => users.find((u) => matches(u, where)) ?? null,
      findFirst: async ({ where }: { where: Row }) => users.find((u) => matches(u, where)) ?? null,
    },
    conversation: {
      findUnique: async ({ where }: { where: Row }) => {
        if (where.userAId_userBId) {
          return conversations.find((c) => matches(c, where.userAId_userBId as Row)) ?? null;
        }
        return conversations.find((c) => matches(c, where)) ?? null;
      },
      upsert: async ({ where, create }: { where: Row; create: Row }) => {
        const existing = conversations.find((c) => matches(c, where.userAId_userBId as Row));
        if (existing) return existing;
        const created: Row = { id: `c-${conversations.length + 1}`, ...create, lastMessageAt: nextDate() };
        conversations.push(created);
        return created;
      },
      updateMany: async ({ where, data }: { where: Row; data: Row }) => {
        const rows = conversations.filter(c => matches(c, where));
        rows.forEach(row => Object.assign(row, data));
        return { count: rows.length };
      },
      update: async ({ where, data }: { where: Row; data: Row }) => {
        const row = conversations.find((c) => matches(c, where))!;
        Object.assign(row, data);
        return row;
      },
      findMany: async ({ where, orderBy }: { where: Row; orderBy: Row }) => {
        const viewerId = ((where.OR as Row[])[0] as Row).userAId as string;
        const rows = conversations.filter((c) => matches(c, where));
        rows.sort((a, b) =>
          orderBy.lastMessageAt === 'desc'
            ? (b.lastMessageAt as Date).getTime() - (a.lastMessageAt as Date).getTime()
            : 0,
        );
        return rows.map((conversation) => {
          const own = messages
            .filter((m) => m.conversationId === conversation.id)
            .sort((a, b) => (b.createdAt as Date).getTime() - (a.createdAt as Date).getTime());
          return {
            ...conversation,
            userA: users.find((u) => u.id === conversation.userAId),
            userB: users.find((u) => u.id === conversation.userBId),
            messages: own.slice(0, 1),
            _count: {
              messages: own.filter((m) => m.readAt === null && m.senderId !== viewerId).length,
            },
          };
        });
      },
    },
    message: {
      findUnique: async ({ where }: { where: Row }) => messages.find((m) => matches(m, where)) ?? null,
      create: async ({ data }: { data: Row }) => {
        const created: Row = { id: `m-${messages.length + 1}`, ...data, readAt: null, createdAt: nextDate() };
        messages.push(created);
        return withSender(created);
      },
      findMany: async ({ where, orderBy, take }: { where: Row; orderBy: Row; take: number }) => {
        const rows = messages.filter((m) => matches(m, where));
        const order = Array.isArray(orderBy) ? orderBy[0] : orderBy;
        rows.sort((a, b) =>
          (a.createdAt as Date).getTime() === (b.createdAt as Date).getTime() ? (order.createdAt === 'desc' ? String(b.id).localeCompare(String(a.id)) : String(a.id).localeCompare(String(b.id))) :
          order.createdAt === 'desc'
            ? (b.createdAt as Date).getTime() - (a.createdAt as Date).getTime()
            : (a.createdAt as Date).getTime() - (b.createdAt as Date).getTime(),
        );
        return rows.slice(0, take).map(withSender);
      },
      updateMany: async ({ where, data }: { where: Row; data: Row }) => {
        const rows = messages.filter((m) => matches(m, where));
        rows.forEach((row) => Object.assign(row, data));
        return { count: rows.length };
      },
    },
  };

  const database = prisma as unknown as PrismaService;
  database.$transaction = (async (run: (tx: PrismaService) => unknown) => {
    const savedMessages = messages.map(row => ({ ...row }));
    const savedConversations = conversations.map(row => ({ ...row }));
    try { return await run(database); }
    catch (err) { messages.splice(0, messages.length, ...savedMessages); conversations.splice(0, conversations.length, ...savedConversations); throw err; }
  }) as unknown as typeof database.$transaction;
  database.message.upsert = (async ({ where, create }: { where: Row; create: Row }) => {
    const pair = where.conversationId_senderId_clientMessageId as Row;
    const found = messages.find(row => matches(row, pair));
    return found ? withSender(found) : prisma.message.create({ data: create });
  }) as unknown as typeof database.message.upsert;
  return { prisma: database, conversations, messages };

}

describe('ChatService', () => {
  let store: ReturnType<typeof createChatStore>;
  let chat: ChatService;

  const VRUSHALI = 'u-vrushali';
  const VIKRANT = 'u-vikrant';
  const NOSY = 'u-nosy';

  beforeEach(() => {
    store = createChatStore();
    chat = new ChatService(store.prisma, asBlocks(createBlocksMock()));
  });

  describe('starting a conversation', () => {
    it('matches GitHub usernames without case sensitivity and preserves self-chat protection', async () => {
      const opened = await chat.startConversation(VRUSHALI, 'ViKrAnT');
      expect(opened.user.username).toBe('vikrant');
      await expect(chat.startConversation(VRUSHALI, 'VRUSHALI')).rejects.toBeInstanceOf(BadRequestException);
    });
    it('opens one conversation and returns the same one to both people', async () => {
      const opened = await chat.startConversation(VRUSHALI, 'vikrant');
      const reopened = await chat.startConversation(VIKRANT, 'vrushali');

      expect(reopened.id).toBe(opened.id);
      expect(store.conversations).toHaveLength(1);
    });

    it('shows each participant the other person', async () => {
      const forVrushali = await chat.startConversation(VRUSHALI, 'vikrant');
      const forVikrant = await chat.startConversation(VIKRANT, 'vrushali');

      expect(forVrushali.user.username).toBe('vikrant');
      expect(forVikrant.user.username).toBe('vrushali');
    });

    it('rejects an unknown username and self-chat', async () => {
      await expect(chat.startConversation(VRUSHALI, 'ghost')).rejects.toBeInstanceOf(NotFoundException);
      await expect(chat.startConversation(VRUSHALI, 'vrushali')).rejects.toBeInstanceOf(BadRequestException);
    });
  });

  describe('sending and receiving', () => {
    it('lets both people send, and each sees the full thread in order', async () => {
      const { id } = await chat.startConversation(VRUSHALI, 'vikrant');

      await chat.sendMessage(id, VRUSHALI, { content: 'Hey Vikrant, free to pair?' });
      await chat.sendMessage(id, VIKRANT, { content: 'Yes, after standup.' });
      await chat.sendMessage(id, VRUSHALI, { content: 'Perfect.' });

      const asVrushali = await chat.getMessages(id, VRUSHALI);
      const asVikrant = await chat.getMessages(id, VIKRANT);

      expect(asVrushali.map((m) => m.content)).toEqual([
        'Hey Vikrant, free to pair?',
        'Yes, after standup.',
        'Perfect.',
      ]);
      expect(asVikrant.map((m) => m.content)).toEqual(asVrushali.map((m) => m.content));

      // The same message is "mine" to its sender and not to the recipient
      expect(asVrushali.map((m) => m.mine)).toEqual([true, false, true]);
      expect(asVikrant.map((m) => m.mine)).toEqual([false, true, false]);
    });

    it('persists history across separate reads', async () => {
      const { id } = await chat.startConversation(VRUSHALI, 'vikrant');
      await chat.sendMessage(id, VRUSHALI, { content: 'Saved for later' });

      const reread = await chat.getMessages(id, VIKRANT);
      expect(reread).toHaveLength(1);
      expect(reread[0].content).toBe('Saved for later');
    });

    it('carries a code snippet with its language', async () => {
      const { id } = await chat.startConversation(VRUSHALI, 'vikrant');
      const sent = await chat.sendMessage(id, VRUSHALI, {
        content: 'Shared a code snippet:',
        codeSnippet: 'const x = 1;',
        codeLanguage: 'typescript',
      });

      expect(sent.codeSnippet).toEqual({ language: 'typescript', code: 'const x = 1;' });
    });

    it('refuses an empty message', async () => {
      const { id } = await chat.startConversation(VRUSHALI, 'vikrant');
      await expect(chat.sendMessage(id, VRUSHALI, { content: '   ' })).rejects.toBeInstanceOf(BadRequestException);
    });

    it('quotes a reply from the same conversation and refuses one from another', async () => {
      const mine = await chat.startConversation(VRUSHALI, 'vikrant');
      const theirs = await chat.startConversation(VIKRANT, 'nosy');

      const original = await chat.sendMessage(mine.id, VRUSHALI, { content: 'Original point' });
      const elsewhere = await chat.sendMessage(theirs.id, VIKRANT, { content: 'Unrelated secret' });

      const reply = await chat.sendMessage(mine.id, VIKRANT, {
        content: 'Agreed',
        replyToId: original.id as string,
      });
      expect(reply.replyTo?.content).toBe('Original point');

      await expect(
        chat.sendMessage(mine.id, VIKRANT, { content: 'Leak?', replyToId: elsewhere.id as string }),
      ).rejects.toBeInstanceOf(BadRequestException);
    });

    it('returns only what arrived after a timestamp, which is how polling catches up', async () => {
      const { id } = await chat.startConversation(VRUSHALI, 'vikrant');
      const first = await chat.sendMessage(id, VRUSHALI, { content: 'first' });
      await chat.sendMessage(id, VIKRANT, { content: 'second' });

      const delta = await chat.getMessages(id, VRUSHALI, { after: first.createdAt });
      expect(delta.map((m) => m.content)).toEqual(['second']);
    });
  });

  describe('the conversation list', () => {
    it('counts what the other person sent as unread, and clears it on read', async () => {
      const { id } = await chat.startConversation(VRUSHALI, 'vikrant');
      await chat.sendMessage(id, VIKRANT, { content: 'one' });
      await chat.sendMessage(id, VIKRANT, { content: 'two' });
      await chat.sendMessage(id, VRUSHALI, { content: 'my own, never unread to me' });

      const [before] = await chat.listConversations(VRUSHALI);
      expect(before.unreadCount).toBe(2);
      expect(before.lastMessage).toBe('my own, never unread to me');

      await chat.markRead(id, VRUSHALI, store.messages.map(message => message.id as string));
      const [after] = await chat.listConversations(VRUSHALI);
      expect(after.unreadCount).toBe(0);
    });

    it('puts the most recently active conversation first', async () => {
      const withVikrant = await chat.startConversation(VRUSHALI, 'vikrant');
      await chat.startConversation(VRUSHALI, 'nosy');

      await chat.sendMessage(withVikrant.id, VRUSHALI, { content: 'later' });

      const list = await chat.listConversations(VRUSHALI);
      expect(list[0].id).toBe(withVikrant.id);
      expect(list.map((c) => c.user.username)).toEqual(['vikrant', 'nosy']);
    });

    it('never lists a conversation the viewer is not part of', async () => {
      await chat.startConversation(VRUSHALI, 'vikrant');
      expect(await chat.listConversations(NOSY)).toEqual([]);
    });
  });

  describe('delivery regressions', () => {
    it('retries the same client message without duplicating it or regressing activity', async () => {
      const { id } = await chat.startConversation(VRUSHALI, 'vikrant');
      const payload = { content: 'once', clientMessageId: 'retry-key' };
      const first = await chat.sendMessage(id, VRUSHALI, payload);
      await chat.sendMessage(id, VIKRANT, { content: 'newer' });
      const latest = store.conversations[0].lastMessageAt;
      const retry = await chat.sendMessage(id, VRUSHALI, payload);
      expect(retry.id).toBe(first.id);
      expect(store.messages).toHaveLength(2);
      expect(store.conversations[0].lastMessageAt).toEqual(latest);
    });
    it('rolls back message creation if the activity update fails', async () => {
      const { id } = await chat.startConversation(VRUSHALI, 'vikrant');
      vi.spyOn(store.prisma.conversation, 'updateMany').mockRejectedValueOnce(new Error('failed'));
      await expect(chat.sendMessage(id, VRUSHALI, { content: 'atomic' })).rejects.toThrow('failed');
      expect(store.messages).toHaveLength(0);
    });
    it('keeps unseen arrivals unread', async () => {
      const { id } = await chat.startConversation(VRUSHALI, 'vikrant');
      const shown = await chat.sendMessage(id, VIKRANT, { content: 'shown' });
      await chat.sendMessage(id, VIKRANT, { content: 'not fetched' });
      await chat.markRead(id, VRUSHALI, [shown.id]);
      expect((await chat.listConversations(VRUSHALI))[0].unreadCount).toBe(1);
    });
    it('pages both ways without losing messages with identical timestamps', async () => {
      const { id } = await chat.startConversation(VRUSHALI, 'vikrant');
      for (const content of ['one', 'two', 'three']) await chat.sendMessage(id, VIKRANT, { content });
      store.messages.forEach(row => { row.createdAt = new Date('2026-10-15T00:00:00Z'); });
      const newest = await chat.getMessages(id, VRUSHALI, { limit: 1 });
      const older = await chat.getMessages(id, VRUSHALI, { before: newest[0].cursor, limit: 2 });
      expect(older.map(row => row.content)).toEqual(['one', 'two']);
      const delta = await chat.getMessages(id, VRUSHALI, { after: older[0].cursor });
      expect(delta.map(row => row.content)).toEqual(['two', 'three']);
    });
  });

  describe('authorization', () => {
    it('hides a private conversation from everyone else', async () => {
      const { id } = await chat.startConversation(VRUSHALI, 'vikrant');
      await chat.sendMessage(id, VRUSHALI, { content: 'Private' });

      // Reading, writing and marking read are all closed to an outsider,
      // and all answer 404 so the id itself stays unconfirmed.
      await expect(chat.getMessages(id, NOSY)).rejects.toBeInstanceOf(NotFoundException);
      await expect(chat.sendMessage(id, NOSY, { content: 'Butting in' })).rejects.toBeInstanceOf(NotFoundException);
      await expect(chat.markRead(id, NOSY, [])).rejects.toBeInstanceOf(NotFoundException);
    });

    it('answers 404 for a conversation that does not exist', async () => {
      await expect(chat.getMessages('c-nonexistent', VRUSHALI)).rejects.toBeInstanceOf(NotFoundException);
    });
  });
});
