import { Inject, Injectable, Logger } from '@nestjs/common';
import { PrismaService, withDbRetry } from '../../database/prisma.service';
import { compareSubmissions, isSuspicious } from './similarity';

/**
 * Looks for submissions in one battle that are too alike.
 *
 * Runs once, after the battle completes. Not while it is running: a player
 * who autosaves the same shape as somebody else halfway through has not done
 * anything yet, and comparing drafts would flag people for thinking alike.
 *
 * Nothing here punishes anybody. It writes a flag, and a person decides.
 * The measurement can say two submissions are the same; it cannot say who
 * copied whom, or tell copying apart from two people who read the same
 * tutorial. Both of those are why this ends at a queue.
 */
@Injectable()
export class DetectionService {
  private readonly logger = new Logger(DetectionService.name);

  constructor(@Inject(PrismaService) private readonly prisma: PrismaService) {}

  /**
   * Compares every pair of handed-in submissions in a battle.
   *
   * Quadratic in the field size, which is fine: a lobby holds at most twenty,
   * so the worst case is a hundred and ninety comparisons of a few hundred
   * tokens each, once, after the battle is already over.
   */
  public async scanBattle(battleId: string): Promise<{ compared: number; flagged: number }> {
    const participants = await withDbRetry(() =>
      this.prisma.battleParticipant.findMany({
        where: {
          battleId,
          state: 'SUBMITTED',
          // A ghost is a copy of somebody's past submission by design. Of
          // course it matches something - that is the feature.
          isGhost: false,
          submission: { submittedAt: { not: null } },
        },
        select: {
          id: true,
          userId: true,
          submission: { select: { code: true } },
        },
      }),
    );

    if (participants.length < 2) return { compared: 0, flagged: 0 };

    let compared = 0;
    let flagged = 0;

    for (let i = 0; i < participants.length; i++) {
      for (let j = i + 1; j < participants.length; j++) {
        const a = participants[i];
        const b = participants[j];
        const codeA = a.submission?.code ?? '';
        const codeB = b.submission?.code ?? '';
        if (!codeA || !codeB) continue;

        compared++;
        const result = compareSubmissions(codeA, codeB);
        if (!isSuspicious(result)) continue;

        // A stable order, so re-running the scan updates one row rather than
        // writing the same pair the other way round.
        const [first, second] = a.id < b.id ? [a.id, b.id] : [b.id, a.id];

        await withDbRetry(() =>
          this.prisma.battleFlag.upsert({
            where: { participantAId_participantBId: { participantAId: first, participantBId: second } },
            // A re-scan refreshes the measurement but must not reopen
            // something a reviewer has already decided.
            update: { score: result.score, detail: result.detail },
            create: {
              battleId,
              kind: 'SIMILARITY',
              participantAId: first,
              participantBId: second,
              score: result.score,
              detail: result.detail,
            },
            select: { id: true },
          }),
        );
        flagged++;
      }
    }

    if (flagged > 0) {
      this.logger.warn(`Battle ${battleId}: ${flagged} of ${compared} pairs look alike`);
    }
    return { compared, flagged };
  }
}
