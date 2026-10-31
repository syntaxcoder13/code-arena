import { EventsService } from '../events/events.service';
import { Optional } from '@nestjs/common';
import { Inject,Injectable,Logger } from '@nestjs/common';
import { PrismaService,withDbRetry } from '../../database/prisma.service';
import { Contender,rankContenders,RankedContender,winnerOf } from './ranking';
import { DetectionService } from './detection.service';
import { errorMessage } from '../../common/utils/errors.util';

export interface BattleOutcome {
  completed: boolean;
  ranked: RankedContender[];
  winnerParticipantId: string | null;
}

/** Nothing to do yet: something is still being judged. */
const pending = (): BattleOutcome => ({ completed: false, ranked: [], winnerParticipantId: null });

/**
 * Turns judged submissions into a finished battle.
 *
 * Runs once every submission has a verdict, so the whole field is ranked in
 * one pass against the same ladder rather than placed one at a time.
 */
@Injectable()
export class BattleRankingService {
  private readonly logger = new Logger(BattleRankingService.name);

  constructor(
    @Inject(PrismaService) private readonly prisma: PrismaService,
    @Inject(DetectionService) private readonly detection: DetectionService,
    @Optional() @Inject(EventsService) private readonly events?: EventsService,
  ) {}

  /**
   * Finishes the battle if everything has been judged, and does nothing if
   * not.
   *
   * Safe to call after every judged submission: it is the last one to finish
   * that actually completes the battle.
   */
  public async completeIfJudged(battleId: string): Promise<BattleOutcome> {
    const battle = await withDbRetry(() =>
      this.prisma.battle.findUnique({
        where: { id: battleId },
        select: {
          state: true,
          participants: {
            where: { state: 'SUBMITTED' },
            select: {
              id: true,
              submission: {
                select: {
                  submittedAt: true,
                  judgement: {
                    select: {
                      state: true,
                      passedGate: true,
                      passedTests: true,
                      totalTests: true,
                      runtimeMs: true,
                      memoryKb: true,
                    },
                  },
                },
              },
            },
          },
        },
      }),
    );

    if (!battle || (battle.state !== 'JUDGING' && battle.state !== 'SUBMITTED')) {
      return pending();
    }
    if (battle.participants.length === 0) {
      return pending();
    }

    const contenders: Contender[] = [];
    for (const participant of battle.participants) {
      const judgement = participant.submission?.judgement;
      // A verdict that failed is a sandbox outage, not a loss. Leaving the
      // battle in JUDGING keeps it visibly stuck and retryable; scoring
      // somebody as wrong because the runner was down would not be undoable.
      if (!judgement || judgement.state !== 'COMPLETE') {
        return pending();
      }

      contenders.push({
        participantId: participant.id,
        passedGate: judgement.passedGate,
        passedTests: judgement.passedTests,
        totalTests: judgement.totalTests,
        runtimeMs: judgement.runtimeMs,
        memoryKb: judgement.memoryKb,
        submittedAt: participant.submission?.submittedAt ?? new Date(0),
      });
    }

    const ranked = rankContenders(contenders);
    const winner = winnerOf(ranked);

    await withDbRetry(() =>
      this.prisma.$transaction([
        ...ranked.map((entry) =>
          this.prisma.battleParticipant.update({
            where: { id: entry.participantId },
            data: { rank: entry.rank, decidedBy: entry.decidedBy },
          }),
        ),
        this.prisma.battle.update({
          where: { id: battleId },
          data: { state: 'COMPLETE', completedAt: new Date(), finalPlayerCount: ranked.length },
        }),
      ]),
    );

    void this.events?.notify('battle.changed', battleId);
    this.logger.log(
      winner
        ? `Battle ${battleId} complete: ${ranked.length} ranked, won on ${ranked[1]?.decidedBy ?? 'the only submission'}`
        : `Battle ${battleId} complete with no winner`,
    );

    // The single point at which a battle becomes COMPLETE, so the scan runs
    // exactly once however completion was reached. It looks for submissions
    // that are too alike and writes a flag; it never changes the result. A
    // detector that could take a placing away by itself would be one bug
    // away from taking the wrong one.
    try {
      await this.detection.scanBattle(battleId);
    } catch (err) {
      // A battle that finished must stay finished. Losing a scan costs a
      // flag nobody was waiting for; failing the completion would leave the
      // whole field stuck in JUDGING.
      this.logger.warn(`Similarity scan failed for battle ${battleId}: ${errorMessage(err)}`);
    }

    return { completed: true, ranked, winnerParticipantId: winner?.participantId ?? null };
  }

  /** Marks a battle as being judged, so its state is not silently stuck. */
  public async markJudging(battleId: string): Promise<void> {
    await withDbRetry(() =>
      this.prisma.battle.updateMany({
        where: { id: battleId, state: 'SUBMITTED' },
        data: { state: 'JUDGING' },
      }),
    );
  }
}
