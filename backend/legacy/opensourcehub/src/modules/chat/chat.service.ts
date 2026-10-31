import { EventsService } from '../events/events.service';
import { Optional } from '@nestjs/common';
import {
BadRequestException,
ForbiddenException,
Inject,
Injectable,
NotFoundException,
} from '@nestjs/common';
import { Conversation,Message,User,Prisma } from '@prisma/client';
import { PrismaService,withDbRetry } from '../../database/prisma.service';
import { displayAvatar } from '../users/profile.service';
import { BlockService } from '../moderation/block.service';
import { SendMessageDto } from './dto/chat.dto';

const MESSAGE_PAGE_SIZE = 50;
const MAX_MESSAGE_PAGE_SIZE = 200;

/** The shape the chat UI renders for one message. */
export interface ChatMessageView {
  id: string;
  chatId: string;
  sender: {
    name: string;
    username: string;
    avatarUrl: string;
    isOnline: boolean;
  };
  content: string;
  codeSnippet?: { language: string; code: string };
  replyTo?: { id: string; senderName: string; content: string };
  cursor: string;
  clientMessageId?: string;
  createdAt: string;
  mine: boolean;
}

/** One row in the conversation sidebar. */
export interface ConversationView {
  id: string;
  user: {
    id: string;
    name: string;
    username: string;
    avatarUrl: string;
    bio: string;
  };
  lastMessage: string;
  lastMessageAt: string;
  unreadCount: number;
  /** Their messages still arrive; they just stop asking for attention. */
  muted: boolean;
}

type ParticipantFields = Pick<User, 'id' | 'name' | 'username' | 'avatarUrl' | 'customAvatarUrl' | 'bio'>;

const PARTICIPANT_SELECT = {
  id: true,
  name: true,
  username: true,
  avatarUrl: true,
  customAvatarUrl: true,
  bio: true,
} as const;

type ReplyPreview = Pick<Message, 'id' | 'body' | 'codeSnippet'> & {
  sender: Pick<User, 'name' | 'username'>;
};

type MessageWithSender = Message & {
  sender: ParticipantFields;
  replyTo: ReplyPreview | null;
};

const MESSAGE_INCLUDE = {
  sender: { select: PARTICIPANT_SELECT },
  replyTo: {
    select: {
      id: true,
      body: true,
      codeSnippet: true,
      sender: { select: { name: true, username: true } },
    },
  },
} as const;

/**
 * Private 1:1 conversations.
 *
 * Every read and write goes through {@link ChatService.participantConversation},
 * so a user can only reach a conversation they are one of the two members of.
 */
@Injectable()
export class ChatService {
  constructor(
    @Inject(PrismaService) private readonly prisma: PrismaService,
    @Inject(BlockService) private readonly blocks: BlockService,
    @Optional() @Inject(EventsService) private readonly events?: EventsService,
  ) {}

  /** Stable ordering so a pair maps to exactly one row, whoever starts it. */
  private static pair(one: string, two: string): { userAId: string; userBId: string } {
    return one < two ? { userAId: one, userBId: two } : { userAId: two, userBId: one };
  }

  /**
   * Loads a conversation and proves the caller belongs to it.
   *
   * Missing and forbidden both surface as 404: telling a stranger that a
   * conversation id exists is itself a leak.
   */
  private async participantConversation(conversationId: string, userId: string): Promise<Conversation> {
    const conversation = await withDbRetry(() =>
      this.prisma.conversation.findUnique({ where: { id: conversationId } }),
    );
    if (!conversation || (conversation.userAId !== userId && conversation.userBId !== userId)) {
      throw new NotFoundException('Conversation not found');
    }
    return conversation;
  }

  /** Finds the existing 1:1 conversation with `username`, or opens one. */
  public async startConversation(userId: string, username: string): Promise<ConversationView> {
    const other = await withDbRetry(() =>
      this.prisma.user.findFirst({ where: { username: { equals: username.trim(), mode: 'insensitive' } }, select: PARTICIPANT_SELECT }),
    );
    if (!other) {
      throw new NotFoundException('No developer with that username is on OpenSourceHub yet');
    }
    if (other.id === userId) {
      throw new BadRequestException('You cannot start a conversation with yourself');
    }

    // Either direction of a block closes the door, and the refusal is the
    // same sentence whichever side set it: a person who has been blocked is
    // not told that they have been.
    const standing = await this.blocks.between(userId, other.id);
    if (standing.blocked) {
      throw new ForbiddenException('You cannot start a conversation with this person');
    }

    const pair = ChatService.pair(userId, other.id);
    const conversation = await withDbRetry(() =>
      this.prisma.conversation.upsert({
        where: { userAId_userBId: pair },
        update: {},
        create: pair,
      }),
    );

    return {
      id: conversation.id,
      user: toParticipant(other),
      lastMessage: '',
      lastMessageAt: conversation.lastMessageAt.toISOString(),
      unreadCount: 0,
      muted: false,
    };
  }

  /** The caller's conversations, most recently active first. */
  public async listConversations(userId: string): Promise<ConversationView[]> {
    const conversations = await withDbRetry(() =>
      this.prisma.conversation.findMany({
        where: { OR: [{ userAId: userId }, { userBId: userId }] },
        orderBy: { lastMessageAt: 'desc' },
        include: {
          userA: { select: PARTICIPANT_SELECT },
          userB: { select: PARTICIPANT_SELECT },
          // One query for the whole list: the newest message per conversation
          messages: { orderBy: { createdAt: 'desc' }, take: 1 },
          _count: {
            select: {
              messages: { where: { readAt: null, senderId: { not: userId } } },
            },
          },
        },
      }),
    );

    const others = conversations.map((conversation) =>
      conversation.userAId === userId ? conversation.userBId : conversation.userAId,
    );
    const [blocked, muted] = await Promise.all([
      this.blocks.blockedIds(userId),
      this.blocks.mutedAmong(userId, others),
    ]);
    const hidden = new Set(blocked);

    return conversations
      // A blocked conversation leaves the list entirely, whichever side set
      // the block. Its history is still reachable by id - what is removed is
      // the standing invitation to go back to it.
      .filter((conversation) => {
        const otherId = conversation.userAId === userId ? conversation.userBId : conversation.userAId;
        return !hidden.has(otherId);
      })
      .map((conversation) => {
        const other = conversation.userAId === userId ? conversation.userB : conversation.userA;
        const latest = conversation.messages[0];
        return {
          id: conversation.id,
          user: toParticipant(other),
          lastMessage: latest ? preview(latest) : '',
          lastMessageAt: conversation.lastMessageAt.toISOString(),
          // A mute is exactly this: the messages still arrive and can still
          // be read, they just stop asking to be.
          unreadCount: muted.has(other.id) ? 0 : conversation._count.messages,
          muted: muted.has(other.id),
        };
      });
  }

  /**
   * Conversation history, oldest-first.
   *
   * `before` pages backwards through history; `after` returns only what has
   * arrived since, which is what an open conversation polls for.
   */
  public async getMessages(
    conversationId: string,
    userId: string,
    options: { limit?: number; before?: string; after?: string } = {},
  ): Promise<ChatMessageView[]> {
    await this.participantConversation(conversationId, userId);

    const limit = Math.min(Math.max(options.limit ?? MESSAGE_PAGE_SIZE, 1), MAX_MESSAGE_PAGE_SIZE);
    if (options.before && options.after) throw new BadRequestException('Use before or after, not both');
    if (options.limit !== undefined && (!Number.isInteger(options.limit) || options.limit < 1)) throw new BadRequestException('Invalid limit');
    const before = parseCursor(options.before);
    const after = parseCursor(options.after);
    const boundary = before || after;
    const direction = after ? 'gt' : 'lt';
    const filter: Prisma.MessageWhereInput = boundary ? (boundary.id ? {
      OR: [ { createdAt: { [direction]: boundary.at } }, { createdAt: boundary.at, id: { [direction]: boundary.id } } ],
    } : { createdAt: { [direction]: boundary.at } }) : {};

    const messages = await withDbRetry(() =>
      this.prisma.message.findMany({
        where: {
          conversationId,
          ...filter,
        },
        // Newest `limit` when paging back, oldest when catching up
        orderBy: [{ createdAt: after ? 'asc' : 'desc' }, { id: after ? 'asc' : 'desc' }],
        take: limit,
        include: MESSAGE_INCLUDE,
      }),
    );

    const ordered = after ? messages : [...messages].reverse();
    return ordered.map((message) => toMessageView(message, userId));
  }

  /** Stores a message and bumps the conversation's activity timestamp. */
  public async sendMessage(
    conversationId: string,
    userId: string,
    data: SendMessageDto,
  ): Promise<ChatMessageView> {
    const conversation = await this.participantConversation(conversationId, userId);

    const otherId = conversation.userAId === userId ? conversation.userBId : conversation.userAId;
    // Checked on every send rather than once when the conversation opens,
    // because a block is usually set in the middle of one.
    const standing = await this.blocks.between(userId, otherId);
    if (standing.blocked) {
      throw new ForbiddenException('You cannot send messages in this conversation');
    }

    const body = (data.content ?? '').trim();
    const code = (data.codeSnippet ?? '').trim();
    if (!body && !code) {
      throw new BadRequestException('A message needs text or a code snippet');
    }

    if (data.replyToId) {
      const target = await withDbRetry(() =>
        this.prisma.message.findUnique({
          where: { id: data.replyToId },
          select: { conversationId: true },
        }),
      );
      // Quoting a message from another conversation would echo its content back
      if (!target || target.conversationId !== conversationId) {
        throw new BadRequestException('You can only reply to a message in this conversation');
      }
    }

    const store = () => this.prisma.$transaction(async (tx) => {
      const dataToSave = {
        conversationId, senderId: userId, body, codeSnippet: code,
        codeLanguage: code ? data.codeLanguage || 'text' : '',
        replyToId: data.replyToId ?? null,
        clientMessageId: data.clientMessageId ?? null,
      };
      const message = data.clientMessageId ? await tx.message.upsert({
        where: { conversationId_senderId_clientMessageId: { conversationId, senderId: userId, clientMessageId: data.clientMessageId } },
        update: {}, create: dataToSave, include: MESSAGE_INCLUDE,
      }) : await tx.message.create({ data: dataToSave, include: MESSAGE_INCLUDE });
      await tx.conversation.updateMany({
        where: { id: conversation.id, lastMessageAt: { lt: message.createdAt } },
        data: { lastMessageAt: message.createdAt },
      });
      return message;
    });
    const message = data.clientMessageId ? await withDbRetry(store) : await store();
    void this.events?.notify('chat.changed', conversationId);
    return toMessageView(message, userId);
  }

  /** Marks everything the other person sent as read. */
  public async markRead(conversationId: string, userId: string, messageIds: string[]): Promise<{ read: number }> {
    await this.participantConversation(conversationId, userId);

    const { count } = await withDbRetry(() =>
      this.prisma.message.updateMany({
        where: { conversationId, id: { in: messageIds }, senderId: { not: userId }, readAt: null },
        data: { readAt: new Date() },
      }),
    );
    if (count) void this.events?.notify('chat.changed', conversationId);
    return { read: count };
  }
}

function toParticipant(user: ParticipantFields) {
  return {
    id: user.id,
    name: user.name || user.username,
    username: user.username,
    avatarUrl: displayAvatar(user),
    bio: user.bio || '',
  };
}

function preview(message: Pick<Message, 'body' | 'codeSnippet'>): string {
  return message.body || (message.codeSnippet ? 'Shared a code snippet' : '');
}

function toMessageView(message: MessageWithSender, viewerId: string): ChatMessageView {
  return {
    id: message.id,
    chatId: message.conversationId,
    sender: {
      name: message.sender.name || message.sender.username,
      username: message.sender.username,
      avatarUrl: displayAvatar(message.sender),
      isOnline: false,
    },
    content: message.body,
    codeSnippet: message.codeSnippet
      ? { language: message.codeLanguage || 'text', code: message.codeSnippet }
      : undefined,
    replyTo: message.replyTo
      ? {
          id: message.replyTo.id,
          senderName: message.replyTo.sender.name || message.replyTo.sender.username,
          content: preview(message.replyTo) || 'Code snippet',
        }
      : undefined,
    cursor: Buffer.from(JSON.stringify({ at: message.createdAt.toISOString(), id: message.id })).toString('base64url'),
    clientMessageId: message.clientMessageId ?? undefined,
    createdAt: message.createdAt.toISOString(),
    mine: message.senderId === viewerId,
  };
}

function parseCursor(value?: string): { at: Date; id?: string } | undefined {
  if (!value) return undefined;
  if (value.length > 512) throw new BadRequestException('Invalid message cursor');
  try {
    const decoded = JSON.parse(Buffer.from(value, 'base64url').toString('utf8'));
    if (typeof decoded.at !== 'string' || typeof decoded.id !== 'string' || !decoded.id) throw new Error();
    const at = new Date(decoded.at);
    if (Number.isNaN(at.getTime())) throw new Error();
    return { at, id: decoded.id };
  } catch {
    // Existing timestamp clients can continue polling during a rolling deploy.
    const at = new Date(value);
    if (!Number.isNaN(at.getTime())) return { at };
    throw new BadRequestException('Invalid message cursor');
  }
}
