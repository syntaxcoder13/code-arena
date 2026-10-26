import { Inject,Injectable,Logger,BadRequestException,NotFoundException } from '@nestjs/common';
import { SavedProject } from '@prisma/client';
import { PrismaService } from '../../database/prisma.service';
import { GithubService } from '../github/github.service';
import { calculateRepoHealthScore,formatProject,FormattedProject,HealthSummary } from '../projects/project.mapper';
import { errorMessage } from '../../common/utils/errors.util';
import { mapConcurrent } from '../../common/utils/map-concurrent';
import { SaveProjectDto } from './dto/users.dto';
import { asJson,readSnapshot,RepoSnapshot,snapshotIsFresh,toRepoSnapshot } from './saved-snapshots';

@Injectable()
export class SavedProjectsService {
  private readonly logger = new Logger(SavedProjectsService.name);

  constructor(
    @Inject(PrismaService) private readonly prisma: PrismaService,
    @Inject(GithubService) private readonly githubService: GithubService,
  ) {}

  public async getSavedProjects(userId: string): Promise<{ projects: FormattedProject[] }> {
    const saved = await this.prisma.savedProject.findMany({
      where: { userId },
      orderBy: { createdAt: 'desc' },
    });
    return { projects: await mapConcurrent(saved, 3, (doc) => this.toProject(doc)) };
  }

  /** Renders from the stored snapshot; backfills it from GitHub when missing. */
  private async toProject(doc: SavedProject): Promise<FormattedProject> {
    const snapshot = readSnapshot<RepoSnapshot>(doc.metadata);
    if (snapshot.name && snapshotIsFresh(snapshot)) {
      return fromSnapshot(doc, snapshot);
    }

    try {
      const repo = await this.githubService.getRepository(doc.owner, doc.repo);
      await this.prisma.savedProject.update({
        where: { id: doc.id },
        data: { metadata: asJson(toRepoSnapshot(repo)) },
      });
      return { ...formatProject(repo, true), id: doc.id };
    } catch {
      return snapshot.name ? fromSnapshot(doc, snapshot) : fromNotesOnly(doc);
    }
  }

  public async saveProject(userId: string, data: SaveProjectDto) {
    let metadata: RepoSnapshot | undefined;
    try {
      metadata = toRepoSnapshot(await this.githubService.getRepository(data.owner, data.repo));
    } catch (err) {
      this.logger.warn(`Could not fetch repo metadata for snapshot: ${errorMessage(err)}`);
    }

    const fields = {
      notes: data.notes || '',
      tags: data.tags || [],
      ...(metadata ? { metadata: asJson(metadata) } : {}),
    };

    const savedProject = await this.prisma.savedProject.upsert({
      where: { userId_owner_repo: { userId, owner: data.owner, repo: data.repo } },
      update: fields,
      create: { userId, owner: data.owner, repo: data.repo, ...fields },
    });

    return { success: true, savedProject };
  }

  /** Only a saved-row UUID or an explicit owner/repo pair is accepted. */
  public async removeSavedProject(userId: string, identifier: string) {
    const parts = identifier.split('/');
    const where = parts.length === 2 && parts.every(Boolean)
      ? { userId, owner: { equals: parts[0], mode: 'insensitive' as const }, repo: { equals: parts[1], mode: 'insensitive' as const } }
      : /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(identifier) ? { userId, id: identifier } : null;
    if (!where) throw new BadRequestException('Use a saved project UUID or owner/repo');
    const result = await this.prisma.savedProject.deleteMany({ where });
    if (!result.count) throw new NotFoundException('Saved project not found');
    return { success: true, message: 'Project removed from bookmarks' };
  }
}

function savedProjectBase(doc: SavedProject, health: HealthSummary) {
  const url = `https://github.com/${doc.owner}/${doc.repo}`;
  return {
    id: doc.id,
    fullName: `${doc.owner}/${doc.repo}`,
    owner: doc.owner,
    repo: doc.repo,
    license: 'Unknown',
    defaultBranch: 'main',
    updatedAt: doc.updatedAt,
    pushedAt: doc.updatedAt,
    createdAt: doc.createdAt,
    htmlUrl: url,
    githubUrl: url,
    isBookmarked: true,
    healthScore: health.score,
    health,
  };
}

function fromSnapshot(doc: SavedProject, m: Partial<RepoSnapshot>): FormattedProject {
  const health = calculateRepoHealthScore({
    description: m.description,
    stars: m.stars,
    forks: m.forks,
    openIssues: m.openIssuesCount,
    pushedAt: m.pushedAt || doc.updatedAt,
    updatedAt: doc.updatedAt,
    topics: m.topics,
    license: m.license,
    hasLicense: !!m.license && m.license !== 'Unknown',
  });
  const base = savedProjectBase(doc, health);
  return {
    ...base,
    license: m.license || 'Unknown',
    name: m.name || doc.repo,
    description: m.description || '',
    stars: m.stars || 0,
    forks: m.forks || 0,
    openIssues: m.openIssuesCount || 0,
    issues: m.openIssuesCount || 0,
    language: m.primaryLanguage || 'Unknown',
    topics: m.topics || [],
    technologies: m.topics || (m.primaryLanguage ? [m.primaryLanguage] : []),
    htmlUrl: m.url || base.htmlUrl,
    githubUrl: m.url || base.githubUrl,
    avatarUrl: m.ownerAvatarUrl || '',
  };
}

/** Last-resort rendering when neither a snapshot nor GitHub is available. */
function fromNotesOnly(doc: SavedProject): FormattedProject {
  const health = calculateRepoHealthScore({ description: doc.notes, topics: doc.tags, pushedAt: doc.updatedAt });
  return {
    ...savedProjectBase(doc, health),
    name: doc.repo,
    description: doc.notes || '',
    stars: 0,
    forks: 0,
    openIssues: 0,
    issues: 0,
    language: 'Unknown',
    topics: doc.tags || [],
    technologies: doc.tags || [],
    avatarUrl: '',
  };
}
