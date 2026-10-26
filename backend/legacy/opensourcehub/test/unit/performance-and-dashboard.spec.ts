import { describe, expect, it, vi } from 'vitest';
import { metrics } from '../../src/common/observability/metrics';
import { DashboardService } from '../../src/modules/users/dashboard.service';
import { makeUser, asPrisma, asGithub } from '../helpers/mocks';
import { RecommendationsService } from '../../src/modules/recommendations/recommendations.service';
import { ProfileService } from '../../src/modules/users/profile.service';
import { TechStackService } from '../../src/modules/users/tech-stack.service';

describe('bounded performance observations', () => {
  it('keeps rolling percentiles without retaining request payloads', () => {
    for (let i = 1; i <= 150; i++) metrics.observe('test:duration', i, i === 150);
    const sample = metrics.snapshot().find(row => row.name === 'test:duration')!;
    expect(sample).toMatchObject({ count: 150, errors: 1, sampleCount: 128 });
    expect(sample.p95Ms).toBeGreaterThanOrEqual(sample.p50Ms);
    for (let i = 0; i < 400; i++) metrics.observe(`test:bounded:${i}`, 1);
    expect(metrics.snapshot().length).toBeLessThanOrEqual(257);
  });
});
describe('dashboard contribution work', () => {
  it('shares a single lookup with profile and preserves honest availability', async () => {
    const contribution = { available: true, totalThisYear: 12, weeks: [], reconnectRequired: false };
    const github = { getUserContributions: vi.fn().mockResolvedValue(contribution) };
    const profile = { getProfile: vi.fn(async (_id: string, shared: Promise<unknown>) => { expect(await shared).toBe(contribution); return { stats: { contributions: 0, contributionsAvailable: false, streakDays: 0 } }; }) };
    const prisma = { user: { findUnique: vi.fn().mockResolvedValue(makeUser({ technologies: ['Go'] })) } };
    const recommendations = { recommendFor: vi.fn().mockResolvedValue({ projects: [], issues: [] }) };
    const service = new DashboardService(asPrisma(prisma as never), asGithub(github as never), recommendations as unknown as RecommendationsService, profile as unknown as ProfileService, {} as TechStackService);
    const result = await service.getDashboard('user-1');
    expect(github.getUserContributions).toHaveBeenCalledOnce();
    expect(result.user.stats).toMatchObject({ contributions: 12, contributionsAvailable: true, streakDays: 0 });
  });
});
