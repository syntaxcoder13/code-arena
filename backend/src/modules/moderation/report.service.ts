import { BadRequestException,Inject,Injectable,Logger,NotFoundException } from '@nestjs/common';
import { PrismaService,withDbRetry } from '../../database/prisma.service';
import { displayAvatar } from '../../common/utils/avatar';
import { CreateReportDto,ResolveReportDto } from './dto/moderation.dto';

export type ReportState = 'OPEN' | 'ACTIONED' | 'DISMISSED';

const QUEUE_PAGE_SIZE = 50;
/** How much of the reported thing is copied into the report. */
const EVIDENCE_LIMIT = 2000;

const USER_SELECT = {
  id: true,
  username: true,
  name: true,
  avatarUrl: true,
  customAvatarUrl: true,
} as const;

/** A report row as the queries above load it. */
interface ReportRow {
  id: string;
  subjectType: string;
  subjectId: string;
  reason: string;
  detail: string;
  evidence: string;
  state: string;
  resolutionNote: string;
  resolvedAt: Date | null;
  createdAt: Date;
  reporter: ReportUserRow;
  subjectUser: ReportUserRow;
  resolvedBy: { username: string } | null;
}

interface ReportUserRow {
  id: string;
  username: string;
  name: string;
  avatarUrl: string;
  customAvatarUrl: string;
}

interface ReportUserView {
  id: string;
  username: string;
  name: string;
  avatarUrl: string;
}

/** One row in the review queue. */
export interface ReportView {
  id: string;
  reporter: ReportUserView;
  subject: ReportUserView;
  subjectType: string;
  subjectId: string;
  reason: string;
  detail: string;
  evidence: string;
  state: ReportState;
  resolutionNote: string;
  resolvedBy: string;
  resolvedAt: string | null;
  createdAt: string;
  /** How many reports this account has against it, in any state. */
  priorReports: number;
}

function toUserView(user: ReportUserRow): ReportUserView {
  return {
    id: user.id,
    username: user.username,
    name: user.name || user.username,
    avatarUrl: displayAvatar(user),
  };
}

/**
 * Reports and the queue they land in.
 *
 * A report always names a person. It may also point at the one message or
 * submission that prompted it, and when it does, that content is **copied**
 * into the report rather than referenced. A report has to outlive the thing
 * it is about, or deleting the evidence would be the fastest way to clear the
 * queue.
 *
 * Nothing here acts on its own. Filing a report changes nothing about what
 * the reported person can do — that is a decision for whoever reads the
 * queue. What a reporter can do immediately is block, which is the same
 * screen and does not need anybody's permission.
 */
@Injectable()
export class ReportService {
  private readonly logger = new Logger(ReportService.name);

  constructor(@Inject(PrismaService) private readonly prisma: PrismaService) {}

  /**
   * Files a report.
   *
   * One open report per reporter per subject: a second click is not a second
   * report, and it stops one person filling the queue with the same
   * complaint. The earlier one is updated instead, so a reporter who comes
   * back with more detail is not told to go away.
   */
  public async create(reporterId: string, dto: CreateReportDto): Promise<{ id: string; state: ReportState }> {
    const subject = await withDbRetry(() =>
      this.prisma.user.findUnique({ where: { username: dto.username }, select: { id: true } }),
    );
    if (!subject) {
      throw new NotFoundException('No developer with that username is on OpenSourceHub');
    }
    if (subject.id === reporterId) {
      throw new BadRequestException('You cannot report yourself');
    }

    const subjectType = dto.subjectType ?? 'USER';
    const subjectId = (dto.subjectId ?? '').trim();
    if (subjectType !== 'USER' && !subjectId) {
      throw new BadRequestException('Say which message or submission this is about');
    }

    const evidence = await this.captureEvidence(subjectType, subjectId, subject.id);

    const existing = await withDbRetry(() =>
      this.prisma.report.findFirst({
        where: { reporterId, subjectUserId: subject.id, state: 'OPEN' },
        select: { id: true },
      }),
    );

    const data = {
      subjectType,
      subjectId,
      reason: dto.reason ?? 'OTHER',
      detail: (dto.detail ?? '').trim(),
      evidence,
    };

    if (existing) {
      await withDbRetry(() => this.prisma.report.update({ where: { id: existing.id }, data }));
      return { id: existing.id, state: 'OPEN' };
    }

    const report = await withDbRetry(() =>
      this.prisma.report.create({
        data: { reporterId, subjectUserId: subject.id, ...data },
        select: { id: true },
      }),
    );

    this.logger.log(`Report ${report.id}: ${data.reason} against ${subject.id}`);
    return { id: report.id, state: 'OPEN' };
  }

  /**
   * Copies the reported message or submission into the report.
   *
   * Only if it really belongs to the person being reported — otherwise a
   * report is a way to read any message id you can guess.
   */
  private async captureEvidence(
    subjectType: string,
    subjectId: string,
    subjectUserId: string,
  ): Promise<string> {
    if (!subjectId) return '';

    if (subjectType === 'MESSAGE') {
      const message = await withDbRetry(() =>
        this.prisma.message.findUnique({
          where: { id: subjectId },
          select: { senderId: true, body: true, codeSnippet: true },
        }),
      );
      if (!message || message.senderId !== subjectUserId) {
        throw new BadRequestException('That message was not sent by the person you are reporting');
      }
      return [message.body, message.codeSnippet].filter(Boolean).join('\n\n').slice(0, EVIDENCE_LIMIT);
    }

    if (subjectType === 'SUBMISSION') {
      const submission = await withDbRetry(() =>
        this.prisma.submission.findUnique({
          where: { id: subjectId },
          select: { code: true, participant: { select: { userId: true } } },
        }),
      );
      if (!submission || submission.participant?.userId !== subjectUserId) {
        throw new BadRequestException('That submission does not belong to the person you are reporting');
      }
      return submission.code.slice(0, EVIDENCE_LIMIT);
    }

    return '';
  }

  /** The reports a person has filed, so they can see what happened to them. */
  public async listMine(reporterId: string): Promise<ReportView[]> {
    const rows = await withDbRetry(() =>
      this.prisma.report.findMany({
        where: { reporterId },
        orderBy: { createdAt: 'desc' },
        take: QUEUE_PAGE_SIZE,
        include: {
          reporter: { select: USER_SELECT },
          subjectUser: { select: USER_SELECT },
          resolvedBy: { select: { username: true } },
        },
      }),
    );

    // A reporter is shown the outcome, never the reviewer's note: that note
    // is written for other reviewers and may name other accounts.
    return rows.map((row) => ({ ...this.toView(row, 0), resolutionNote: '' }));
  }

  /**
   * The review queue, oldest first.
   *
   * Oldest first because the queue's failure mode is somebody waiting, not
   * somebody waiting behind something interesting.
   */
  public async queue(state: ReportState = 'OPEN'): Promise<ReportView[]> {
    const rows = await withDbRetry(() =>
      this.prisma.report.findMany({
        where: { state },
        orderBy: { createdAt: 'asc' },
        take: QUEUE_PAGE_SIZE,
        include: {
          reporter: { select: USER_SELECT },
          subjectUser: { select: USER_SELECT },
          resolvedBy: { select: { username: true } },
        },
      }),
    );
    if (rows.length === 0) return [];

    // The first question about any report is what else this account has been
    // reported for, so it is answered before it is asked.
    const counts = await withDbRetry(() =>
      this.prisma.report.groupBy({
        by: ['subjectUserId'],
        where: { subjectUserId: { in: rows.map((row) => row.subjectUserId) } },
        _count: { _all: true },
      }),
    );
    const byUser = new Map(counts.map((row) => [row.subjectUserId, row._count._all]));

    return rows.map((row) => this.toView(row, byUser.get(row.subjectUserId) ?? 1));
  }

  /** How many reports are waiting, for the badge on the queue. */
  public async openCount(): Promise<{ open: number }> {
    const open = await withDbRetry(() => this.prisma.report.count({ where: { state: 'OPEN' } }));
    return { open };
  }

  /**
   * Closes a report, one way or the other.
   *
   * Resolving is recorded rather than deleted: who decided what, and when, is
   * the only thing that makes a second report about the same account
   * reviewable.
   */
  public async resolve(
    reportId: string,
    reviewerId: string,
    dto: ResolveReportDto,
  ): Promise<{ id: string; state: ReportState }> {
    const report = await withDbRetry(() =>
      this.prisma.report.findUnique({ where: { id: reportId }, select: { state: true } }),
    );
    if (!report) {
      throw new NotFoundException('Report not found');
    }
    if (report.state !== 'OPEN') {
      throw new BadRequestException('That report has already been resolved');
    }

    const state: ReportState = dto.action === 'ACTIONED' ? 'ACTIONED' : 'DISMISSED';
    await withDbRetry(() =>
      this.prisma.report.update({
        where: { id: reportId },
        data: {
          state,
          resolutionNote: (dto.note ?? '').trim(),
          resolvedById: reviewerId,
          resolvedAt: new Date(),
        },
      }),
    );

    this.logger.log(`Report ${reportId} ${state.toLowerCase()} by ${reviewerId}`);
    return { id: reportId, state };
  }

  private toView(row: ReportRow, priorReports: number): ReportView {
    return {
      id: row.id,
      reporter: toUserView(row.reporter),
      subject: toUserView(row.subjectUser),
      subjectType: row.subjectType,
      subjectId: row.subjectId,
      reason: row.reason,
      detail: row.detail,
      evidence: row.evidence,
      state: row.state as ReportState,
      resolutionNote: row.resolutionNote,
      resolvedBy: row.resolvedBy?.username ?? '',
      resolvedAt: row.resolvedAt ? row.resolvedAt.toISOString() : null,
      createdAt: row.createdAt.toISOString(),
      priorReports,
    };
  }
}
