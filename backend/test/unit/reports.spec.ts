import { afterEach, beforeEach, describe, expect, it } from 'vitest';
import { BadRequestException, ForbiddenException, NotFoundException } from '@nestjs/common';
import { ReportService } from '../../src/modules/moderation/report.service';
import { AdminGuard, isAdmin } from '../../src/modules/moderation/admin.guard';
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

function reportRow(overrides: Record<string, unknown> = {}) {
  return {
    id: 'r-1',
    subjectType: 'USER',
    subjectId: '',
    reason: 'HARASSMENT',
    detail: 'said something vile',
    evidence: '',
    state: 'OPEN',
    resolutionNote: '',
    resolvedAt: null,
    createdAt: new Date('2026-01-01T10:00:00Z'),
    reporter: user(ME, 'me'),
    subjectUser: user(THEM, 'them'),
    resolvedBy: null,
    subjectUserId: THEM,
    ...overrides,
  };
}

describe('ReportService', () => {
  let prisma: PrismaMock;
  const service = () => new ReportService(asPrisma(prisma));

  beforeEach(() => {
    prisma = createPrismaMock();
    prisma.user.findUnique.mockResolvedValue({ id: THEM });
    prisma.report.create.mockResolvedValue({ id: 'r-1' });
    prisma.report.findFirst.mockResolvedValue(null);
  });

  describe('filing one', () => {
    it('names the person, not just the thing', async () => {
      await service().create(ME, { username: 'them', reason: 'SPAM' });

      expect(prisma.report.create.mock.calls[0][0].data).toMatchObject({
        reporterId: ME,
        subjectUserId: THEM,
        reason: 'SPAM',
      });
    });

    it('refuses to report yourself', async () => {
      prisma.user.findUnique.mockResolvedValue({ id: ME });
      await expect(service().create(ME, { username: 'me' })).rejects.toBeInstanceOf(
        BadRequestException,
      );
    });

    it('refuses somebody who is not here', async () => {
      prisma.user.findUnique.mockResolvedValue(null);
      await expect(service().create(ME, { username: 'ghosty' })).rejects.toBeInstanceOf(
        NotFoundException,
      );
    });

    it('needs an id when the report is about a message', async () => {
      await expect(
        service().create(ME, { username: 'them', subjectType: 'MESSAGE' }),
      ).rejects.toBeInstanceOf(BadRequestException);
    });

    it('updates the open one instead of stacking a second', async () => {
      // A reporter coming back with more detail must not be told to go away,
      // and one person must not be able to fill the queue
      prisma.report.findFirst.mockResolvedValue({ id: 'r-existing' });

      const result = await service().create(ME, { username: 'them', detail: 'and again' });

      expect(result.id).toBe('r-existing');
      expect(prisma.report.create).not.toHaveBeenCalled();
      expect(prisma.report.update.mock.calls[0][0].data.detail).toBe('and again');
    });
  });

  describe('the evidence it copies', () => {
    it('copies the message in, so deleting it does not clear the queue', async () => {
      prisma.message.findUnique.mockResolvedValue({
        senderId: THEM,
        body: 'the offending words',
        codeSnippet: '',
      });

      await service().create(ME, { username: 'them', subjectType: 'MESSAGE', subjectId: 'm-1' });

      expect(prisma.report.create.mock.calls[0][0].data.evidence).toBe('the offending words');
    });

    it('refuses a message the reported person did not send', async () => {
      // Otherwise a report is a way to read any message id you can guess
      prisma.message.findUnique.mockResolvedValue({ senderId: 'someone-else', body: 'private', codeSnippet: '' });

      await expect(
        service().create(ME, { username: 'them', subjectType: 'MESSAGE', subjectId: 'm-1' }),
      ).rejects.toBeInstanceOf(BadRequestException);
    });

    it('refuses a submission that is not theirs', async () => {
      prisma.submission.findUnique.mockResolvedValue({
        code: 'secret',
        participant: { userId: 'someone-else' },
      });

      await expect(
        service().create(ME, { username: 'them', subjectType: 'SUBMISSION', subjectId: 's-1' }),
      ).rejects.toBeInstanceOf(BadRequestException);
    });

    it('copies a submission that is theirs', async () => {
      prisma.submission.findUnique.mockResolvedValue({
        code: 'their answer',
        participant: { userId: THEM },
      });

      await service().create(ME, { username: 'them', subjectType: 'SUBMISSION', subjectId: 's-1' });
      expect(prisma.report.create.mock.calls[0][0].data.evidence).toBe('their answer');
    });
  });

  describe('the queue', () => {
    beforeEach(() => {
      prisma.report.findMany.mockResolvedValue([reportRow()]);
      prisma.report.groupBy.mockResolvedValue([{ subjectUserId: THEM, _count: { _all: 3 } }]);
    });

    it('is oldest first, because the failure mode is somebody waiting', async () => {
      await service().queue();
      expect(prisma.report.findMany.mock.calls[0][0].orderBy).toEqual({ createdAt: 'asc' });
    });

    it('answers "what else has this account been reported for" up front', async () => {
      const [report] = await service().queue();
      expect(report.priorReports).toBe(3);
    });

    it('is empty rather than an error, and asks nothing further', async () => {
      prisma.report.findMany.mockResolvedValue([]);

      expect(await service().queue()).toEqual([]);
      expect(prisma.report.groupBy).not.toHaveBeenCalled();
    });
  });

  describe('what a reporter sees back', () => {
    it('gets the outcome but never the reviewer’s note', async () => {
      // The note is written for other reviewers and may name other accounts
      prisma.report.findMany.mockResolvedValue([
        reportRow({ state: 'ACTIONED', resolutionNote: 'warned, see also r-9' }),
      ]);

      const [mine] = await service().listMine(ME);
      expect(mine.state).toBe('ACTIONED');
      expect(mine.resolutionNote).toBe('');
    });
  });

  describe('resolving', () => {
    it('records who decided and when, rather than deleting', async () => {
      prisma.report.findUnique.mockResolvedValue({ state: 'OPEN' });

      await service().resolve('r-1', 'u-admin', { action: 'ACTIONED', note: 'warned' });

      const data = prisma.report.update.mock.calls[0][0].data;
      expect(data).toMatchObject({ state: 'ACTIONED', resolutionNote: 'warned', resolvedById: 'u-admin' });
      expect(data.resolvedAt).toBeInstanceOf(Date);
      expect(prisma.report.delete).not.toHaveBeenCalled();
    });

    it('refuses to resolve the same report twice', async () => {
      prisma.report.findUnique.mockResolvedValue({ state: 'DISMISSED' });
      await expect(
        service().resolve('r-1', 'u-admin', { action: 'ACTIONED' }),
      ).rejects.toBeInstanceOf(BadRequestException);
    });

    it('404s on a report that is not there', async () => {
      prisma.report.findUnique.mockResolvedValue(null);
      await expect(
        service().resolve('r-nope', 'u-admin', { action: 'DISMISSED' }),
      ).rejects.toBeInstanceOf(NotFoundException);
    });
  });
});

describe('who may read the queue', () => {
  afterEach(() => {
    delete process.env.ADMIN_USERNAMES;
  });

  const context = (username?: string) =>
    ({
      switchToHttp: () => ({ getRequest: () => ({ user: username ? { username } : undefined }) }),
    }) as never;

  it('nobody, when the list is unset', () => {
    // An empty variable must not mean "everyone"
    expect(isAdmin('anyone')).toBe(false);
    expect(() => new AdminGuard().canActivate(context('anyone'))).toThrow(ForbiddenException);
  });

  it('only the names on the deploy’s list', () => {
    process.env.ADMIN_USERNAMES = 'alice, bob';

    expect(new AdminGuard().canActivate(context('alice'))).toBe(true);
    expect(() => new AdminGuard().canActivate(context('carol'))).toThrow(ForbiddenException);
  });

  it('ignores case and spacing, since the list is typed by hand', () => {
    process.env.ADMIN_USERNAMES = '  Alice  ,, bob ';
    expect(isAdmin('ALICE')).toBe(true);
    expect(isAdmin('')).toBe(false);
  });

  it('rejects a request with no session at all', () => {
    process.env.ADMIN_USERNAMES = 'alice';
    expect(() => new AdminGuard().canActivate(context())).toThrow(ForbiddenException);
  });

  it('does not say why it refused', () => {
    // An endpoint that says "you are not an admin" says it is worth attacking
    process.env.ADMIN_USERNAMES = 'alice';
    expect(() => new AdminGuard().canActivate(context('carol'))).toThrow(/not found/i);
  });
});
