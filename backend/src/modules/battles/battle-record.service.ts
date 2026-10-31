import { Inject, Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService, withDbRetry } from '../../database/prisma.service';
import { BattleRecord, RecordedBattle, summarise } from './battle-record';

const HISTORY_PAGE_SIZE = 20;

/** One finished battle, as it reads on a profile. */
export interface BattleHistoryEntry {
  battleId: string;
  problem: { slug: string; title: string; difficulty: string; language: string } | null;
  rank: number | null;
  fieldSize: number;
  /** What separated this placing from the one above it. */
  decidedBy: string | null;
  passedTests: number;
  totalTests: number;
  runtimeMs: number | null;
  invalidated: boolean;
  invalidatedReason: string;
  ghost: boolean;
  completedAt: string | null;
}

export interface BattleProfile {
  record: BattleRecord;
  history: BattleHistoryEntry[];
}

/**
 * A player's battle record, for their profile.
 *
 * Only finished battles: one in progress is not a result, and showing it
 * would make the number move while somebody is looking at it.
 */
@Injectable()
export class BattleRecordService {
  constructor(@Inject(PrismaService) private readonly prisma: PrismaService) {}

  public async forUsername(username: string): Promise<BattleProfile> {
    const user = await withDbRetry(() =>
      this.prisma.user.findUnique({ where: { username }, select: { id: true } }),
    );
    if (!user) {
      throw new NotFoundException('No developer with that username is on OpenSourceHub');
    }
    return this.forUser(user.id);
  }

  public async forUser(userId: string): Promise<BattleProfile> {
    const seats = await withDbRetry(() =>
      this.prisma.battleParticipant.findMany({
        where: {
          userId,
          // Never the ghost copy of somebody's old submission standing in for
          // them: that battle is not theirs and they were never told about it.
          isGhost: false,
          battle: { state: 'COMPLETE' },
        },
        orderBy: { battle: { completedAt: 'desc' } },
        take: HISTORY_PAGE_SIZE,
        select: {
          rank: true,
          decidedBy: true,
          invalidatedAt: true,
          invalidatedReason: true,
          battle: {
            select: {
              id: true,
              visibility: true,
              finalPlayerCount: true,
              completedAt: true,
              problem: { select: { slug: true, title: true, difficulty: true, language: true } },
            },
          },
          submission: {
            select: {
              judgement: {
                select: { state: true, passedTests: true, totalTests: true, runtimeMs: true },
              },
            },
          },
        },
      }),
    );

    const history: BattleHistoryEntry[] = seats.map((seat) => {
      const judgement = seat.submission?.judgement;
      const judged = judgement?.state === 'COMPLETE';
      return {
        battleId: seat.battle.id,
        problem: seat.battle.problem,
        rank: seat.rank,
        fieldSize: seat.battle.finalPlayerCount ?? 0,
        decidedBy: seat.decidedBy,
        passedTests: judged ? judgement.passedTests : 0,
        totalTests: judged ? judgement.totalTests : 0,
        runtimeMs: judged ? judgement.runtimeMs : null,
        invalidated: Boolean(seat.invalidatedAt),
        invalidatedReason: seat.invalidatedReason ?? '',
        ghost: seat.battle.visibility === 'GHOST',
        completedAt: seat.battle.completedAt?.toISOString() ?? null,
      };
    });

    // Summed over the same rows the history shows, so the number on the badge
    // and the list underneath it can never disagree.
    const counted: RecordedBattle[] = history.map((entry) => ({
      rank: entry.rank,
      fieldSize: entry.fieldSize,
      invalidated: entry.invalidated,
      ghost: entry.ghost,
    }));

    return { record: summarise(counted), history };
  }
}
