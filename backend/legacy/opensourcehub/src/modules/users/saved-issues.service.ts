import { Inject,Injectable,Logger,NotFoundException,BadRequestException } from '@nestjs/common';
import { Prisma,SavedIssue } from '@prisma/client';
import { PrismaService } from '../../database/prisma.service';
import { GithubService } from '../github/github.service';
import {
canonicalIssueId,
formatIssue,
FormattedIssue,
issueDifficulty,projectRef,
technologiesFromLabels
} from '../issues/issue.mapper';
import { errorMessage } from '../../common/utils/errors.util';
import { mapConcurrent } from '../../common/utils/map-concurrent';
import { IssueStatus,SaveIssueDto,ToggleBuddyDto } from './dto/users.dto';
import { asJson,IssueSnapshot,readSnapshot,snapshotIsFresh,toIssueSnapshot } from './saved-snapshots';

const DAY_MS = 24 * 60 * 60 * 1000;
export const DEFAULT_CLAIM_DAYS = 7;

/** Workspace fields every saved issue carries on top of the GitHub issue data. */
interface WorkspaceFields {
  status: string;
  isClaimed: boolean;
  claimedAt: Date | null;
  claimExpiresAt: Date | null;
  prUrl: string;
  seekingBuddy: boolean;
  buddyNotes: string;
  notes: string;
}

export type SavedIssueView = Omit<FormattedIssue, 'claimExpiresAt' | 'body' | 'language' | 'buddyNotes'> &
  WorkspaceFields & { body?: string; language?: string };

function workspaceFields(doc: SavedIssue): WorkspaceFields {
  return {
    status: doc.status || 'todo',
    isClaimed: doc.isClaimed || false,
    claimedAt: doc.claimedAt || null,
    claimExpiresAt: doc.claimExpiresAt || null,
    prUrl: doc.prUrl || '',
    seekingBuddy: doc.seekingBuddy || false,
    buddyNotes: doc.buddyNotes || '',
    notes: doc.notes || '',
  };
}

@Injectable()
export class SavedIssuesService {
  private readonly logger = new Logger(SavedIssuesService.name);

  constructor(
    @Inject(PrismaService) private readonly prisma: PrismaService,
    @Inject(GithubService) private readonly githubService: GithubService,
  ) {}

  public async getSavedIssues(userId: string): Promise<{ issues: SavedIssueView[] }> {
    const saved = await this.prisma.savedIssue.findMany({
      where: { userId },
      orderBy: { createdAt: 'desc' },
    });
    return { issues: await mapConcurrent(saved, 3, (doc) => this.toIssueView(doc)) };
  }

  private async toIssueView(doc: SavedIssue): Promise<SavedIssueView> {
    await this.expireStaleClaim(doc);
    const snapshot = readSnapshot<IssueSnapshot>(doc.metadata);
    if (snapshot.title && snapshotIsFresh(snapshot)) {
      return fromSnapshot(doc, snapshot);
    }

    try {
      const issue = await this.githubService.getIssue(doc.owner, doc.repo, doc.issueNumber);
      await this.prisma.savedIssue.update({
        where: { id: doc.id },
        data: { metadata: asJson(toIssueSnapshot(issue)) },
      });
      return { ...formatIssue(issue), ...workspaceFields(doc), id: doc.issueId };
    } catch {
      return snapshot.title ? fromSnapshot(doc, snapshot) : placeholderIssue(doc);
    }
  }

  /** Releases a claim whose deadline has passed. Mutates `doc`. */
  private async expireStaleClaim(doc: SavedIssue): Promise<void> {
    if (!doc.isClaimed || !doc.claimExpiresAt || doc.claimExpiresAt >= new Date()) return;

    doc.isClaimed = false;
    doc.claimExpiresAt = null;
    if (doc.status === 'in_progress') {
      doc.status = 'todo';
    }
    await this.prisma.savedIssue.update({
      where: { id: doc.id },
      data: { isClaimed: false, status: doc.status, claimExpiresAt: null },
    });
  }

  public async saveIssue(userId: string, data: SaveIssueDto) {
    const issueId = canonicalIssueId(data.owner, data.repo, data.issueNumber);

    let metadata: IssueSnapshot | undefined;
    try {
      metadata = toIssueSnapshot(await this.githubService.getIssue(data.owner, data.repo, data.issueNumber));
    } catch (err) {
      this.logger.warn(`Could not fetch issue metadata for snapshot: ${errorMessage(err)}`);
    }

    const fields = {
      owner: data.owner.toLowerCase(),
      repo: data.repo.toLowerCase(),
      issueNumber: data.issueNumber,
      notes: data.notes || '',
      tags: data.tags || [],
      ...(metadata ? { metadata: asJson(metadata) } : {}),
    };

    const savedIssue = await this.prisma.savedIssue.upsert({
      where: { userId_issueId: { userId, issueId } },
      update: fields,
      create: { userId, issueId, ...fields },
    });

    return { success: true, savedIssue };
  }

  public async removeSavedIssue(userId: string, issueId: string) {
    await this.prisma.savedIssue.deleteMany({ where: { userId, issueId } });
    return { success: true, message: 'Issue removed from bookmarks' };
  }

  public async updateStatus(userId: string, issueId: string, status: IssueStatus, prUrl?: string) {
    const update: Prisma.SavedIssueUpdateManyMutationInput = { status };
    if (prUrl !== undefined) {
      update.prUrl = prUrl;
    }
    if (status === 'in_progress') {
      update.isClaimed = true;
      update.claimedAt = new Date();
      update.claimExpiresAt = new Date(Date.now() + DEFAULT_CLAIM_DAYS * DAY_MS);
    } else if (status === 'completed' || status === 'todo') {
      update.isClaimed = false;
      update.claimExpiresAt = null;
    }

    await this.updateOwnIssue(userId, issueId, update);
    return { success: true };
  }

  public async claim(userId: string, issueId: string, days = DEFAULT_CLAIM_DAYS) {
    await this.updateOwnIssue(userId, issueId, {
      isClaimed: true,
      status: 'in_progress',
      claimedAt: new Date(),
      claimExpiresAt: new Date(Date.now() + days * DAY_MS),
    });
    return { success: true };
  }

  public async releaseClaim(userId: string, issueId: string) {
    await this.updateOwnIssue(userId, issueId, { isClaimed: false, status: 'todo', claimExpiresAt: null });
    return { success: true };
  }

  private async updateOwnIssue(userId: string, issueId: string, data: Prisma.SavedIssueUpdateManyMutationInput) {
    const res = await this.prisma.savedIssue.updateMany({ where: { userId, issueId }, data });
    if (res.count === 0) {
      throw new NotFoundException('Saved issue not found');
    }
  }

  public async toggleSeekingBuddy(userId: string, issueId: string, body: ToggleBuddyDto) {
    const { seekingBuddy, buddyNotes } = body;
    let { owner, repo, issueNumber } = await this.resolveIssueRef(userId, issueId, body);

    if (!owner || !repo || !Number.isInteger(issueNumber) || issueNumber < 1) throw new BadRequestException('A valid issue reference is required');
    owner = owner.toLowerCase();
    repo = repo.toLowerCase();
    const hasRef = true;
    const canonicalId = hasRef ? canonicalIssueId(owner, repo, issueNumber) : issueId;

    const savedIssue = await this.prisma.savedIssue.upsert({
      where: { userId_issueId: { userId, issueId: canonicalId } },
      update: {
        seekingBuddy,
        ...(buddyNotes !== undefined ? { buddyNotes } : {}),
        ...(hasRef ? { owner, repo, issueNumber } : {}),
      },
      create: {
        userId,
        issueId: canonicalId,
        owner: owner || '',
        repo: repo || '',
        issueNumber: issueNumber || 0,
        seekingBuddy,
        buddyNotes: buddyNotes || '',
      },
    });

    return { success: true, savedIssue };
  }

  /**
   * Works out which GitHub issue a buddy request is for: from the body, else by
   * parsing "owner/repo#12" or "owner_repo_12", else from the saved row.
   */
  private async resolveIssueRef(
    userId: string,
    issueId: string,
    body: Pick<ToggleBuddyDto, 'owner' | 'repo' | 'issueNumber'>,
  ): Promise<{ owner: string; repo: string; issueNumber: number }> {
    let owner = (body.owner || '').trim();
    let repo = (body.repo || '').trim();
    let issueNumber = body.issueNumber ? Number(body.issueNumber) : 0;

    if (!owner || !repo || !issueNumber) {
      const parsed = parseIssueId(issueId);
      if (parsed) ({ owner, repo, issueNumber } = parsed);
    }

    if (!owner || !repo || !issueNumber) {
      const existing = await this.prisma.savedIssue.findFirst({ where: { userId, issueId } });
      if (existing && existing.owner && existing.repo && existing.issueNumber) {
        ({ owner, repo, issueNumber } = existing);
      }
    }

    return { owner, repo, issueNumber };
  }
}

/** Parses "owner/repo#12" or "owner_repo_12"; null for anything else. */
export function parseIssueId(issueId: string): { owner: string; repo: string; issueNumber: number } | null {
  if (issueId.includes('/') && issueId.includes('#')) {
    const [ownerRepo, numStr] = issueId.split('#');
    const [owner, repo] = ownerRepo.split('/');
    return { owner, repo, issueNumber: parseInt(numStr, 10) || 0 };
  }
  if (issueId.includes('_')) {
    const parts = issueId.split('_');
    if (parts.length >= 3) {
      return { owner: parts[0], repo: parts.slice(1, -1).join('_'), issueNumber: parseInt(parts[parts.length - 1], 10) || 0 };
    }
  }
  return null;
}

function fromSnapshot(doc: SavedIssue, m: Partial<IssueSnapshot>): SavedIssueView {
  const rawLabels = m.labels || [];
  const labelNames = rawLabels.map((l) => (typeof l === 'string' ? l : l.name || ''));
  const ref = projectRef(doc.owner, doc.repo);
  const url = m.htmlUrl || issueUrl(doc);

  return {
    id: doc.issueId || doc.id,
    number: doc.issueNumber,
    title: m.title || '',
    project: ref,
    repository: ref,
    difficulty: issueDifficulty(labelNames),
    technologies: technologiesFromLabels(labelNames),
    labels: labelNames,
    rawLabels: rawLabels as unknown as FormattedIssue['rawLabels'],
    state: m.state || 'open',
    commentsCount: m.commentsCount || 0,
    createdAt: String(m.createdAtGithub || doc.createdAt.toISOString()),
    updatedAt: doc.updatedAt.toISOString(),
    htmlUrl: url,
    githubUrl: url,
    descriptionSnippet: m.title || '',
    author: (m.author as unknown as FormattedIssue['author']) || { username: 'unknown', avatarUrl: '' },
    ...workspaceFields(doc),
  };
}

/** Rendering used when GitHub is unreachable and nothing was snapshotted. */
function placeholderIssue(doc: SavedIssue): SavedIssueView {
  const ref = projectRef(doc.owner, doc.repo);
  const url = issueUrl(doc);
  return {
    id: doc.issueId || doc.id,
    number: doc.issueNumber,
    title: `Issue #${doc.issueNumber}`,
    project: ref,
    repository: ref,
    difficulty: 'beginner',
    technologies: [],
    labels: [],
    rawLabels: [],
    state: 'open',
    commentsCount: 0,
    createdAt: doc.createdAt.toISOString(),
    updatedAt: doc.updatedAt.toISOString(),
    htmlUrl: url,
    githubUrl: url,
    descriptionSnippet: `Issue #${doc.issueNumber}`,
    author: { username: 'unknown', avatarUrl: '' },
    ...workspaceFields(doc),
  };
}

function issueUrl(doc: Pick<SavedIssue, 'owner' | 'repo' | 'issueNumber'>): string {
  return `https://github.com/${doc.owner}/${doc.repo}/issues/${doc.issueNumber}`;
}
