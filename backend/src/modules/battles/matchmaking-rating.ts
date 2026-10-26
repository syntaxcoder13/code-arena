import { Inject, Injectable } from '@nestjs/common';
import { PrismaService } from '../../database/prisma.service';
export function ratingWindow(waitedMs: number) { return Math.min(800, 150 + Math.floor(Math.max(0, waitedMs) / 1000) * 25); }
@Injectable()
export class MatchmakingRatingService {
  constructor(@Inject(PrismaService) private readonly db: PrismaService) {}
  async forUsers(ids: string[]) {
    const ratings = new Map(ids.map(id => [id, 1200]));
    const seats = await this.db.battleParticipant.findMany({ where: { userId: { in: ids }, isGhost: false, invalidatedAt: null, rank: { not: null }, battle: { state: 'COMPLETE', visibility: { not: 'GHOST' }, seriesId: null } }, select: { userId: true, rank: true, submission: { select: { judgement: { select: { passedGate: true } } } } }, orderBy: { battle: { completedAt: 'asc' } } });
    for (const s of seats) ratings.set(s.userId, Math.max(0, (ratings.get(s.userId) ?? 1200) + (s.rank === 1 && s.submission?.judgement?.passedGate ? 25 : -20)));
    return ratings;
  }
}
