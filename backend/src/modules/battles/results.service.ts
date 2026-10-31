import { Inject, Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService, withDbRetry } from '../../database/prisma.service';
import { CaseOutcome } from './judge.service';
import { displayAvatar } from '../../common/utils/avatar';
import { sanitiseTelemetry } from './telemetry';

export interface Standing {
  userId: string;
  username: string;
  name: string;
  avatarUrl: string;
  /** Null for anyone who never handed anything in. */
  rank: number | null;
  /** What separated this placing from the one above it. */
  decidedBy: string | null;
  submitted: boolean;
  passedGate: boolean;
  passedTests: number;
  totalTests: number;
  runtimeMs: number | null;
  memoryKb: number | null;
  submittedAt: string | null;
  isMe: boolean;
  /**
   * This placing belongs to a copy of somebody's old submission, raced while
   * they were elsewhere. Said out loud because the result reads as a win over
   * a person otherwise, and it is not one: they were never in this battle and
   * it never touches their record.
   */
  isGhost: boolean;
  /**
   * Set when a reviewer took this result out of the running. Shown to
   * everybody rather than quietly dropped: in a small community a
   * consequence people can see does more than one they cannot.
   */
  invalidated: boolean;
  invalidatedReason: string;
  /**
   * How many times this player switched away from the tab.
   *
   * Shown beside the result on purpose, and shown for everybody rather than
   * whispered to a moderator: it is a signal, not a ban, and alt-tabbing to
   * read the documentation is what an honest player does too. Null when the
   * submission carries no signals at all.
   */
  focusLosses: number | null;
}

export interface BattleResults {
  battleId: string;
  completedAt: string | null;
  /** Frozen at completion: a rank only means something next to the field. */
  fieldSize: number;
  problem: { slug: string; title: string; difficulty: string; language: string } | null;
  winnerUserId: string | null;
  standings: Standing[];
  /**
   * The caller's own case-by-case result, and nobody else's. Positions and
   * verdicts only - never an input or an expected output, so a hidden case
   * stays hidden even to the person who failed it.
   */
  myCases: CaseOutcome[];
  /** Why the runtime column is empty: the sandbox could not measure it. */
  timingsMeasured: boolean;
}

const PARTICIPANT_SELECT = {
  userId: true,
  state: true,
  isGhost: true,
  rank: true,
  decidedBy: true,
  invalidatedAt: true,
  invalidatedReason: true,
  user: { select: { username: true, name: true, avatarUrl: true, customAvatarUrl: true } },
  submission: {
    select: {
      submittedAt: true,
      telemetry: true,
      judgement: {
        select: {
          state: true,
          passedGate: true,
          passedTests: true,
          totalTests: true,
          runtimeMs: true,
          memoryKb: true,
          cases: true,
        },
      },
    },
  },
} as const;

/**
 * What a finished battle says about itself.
 *
 * Everything here was measured while the battle ran; nothing is recomputed on
 * read. A result that changed shape depending on when it was asked for would
 * not settle the argument it exists to settle.
 */
@Injectable()
export class ResultsService {
  constructor(@Inject(PrismaService) private readonly prisma: PrismaService) {}

  public async getResults(battleId: string, userId: string): Promise<BattleResults> {
    const battle = await withDbRetry(() =>
      this.prisma.battle.findFirst({
        where: { id: battleId },
        // findFirst bypasses Prisma 6.4.1 findUnique batching panics.
        // Battle, participants, users, submissions and judgements: five
        // sequential queries under the default strategy, one with a join
        relationLoadStrategy: 'join',
        select: {
          state: true,
          completedAt: true,
          finalPlayerCount: true,
          problem: { select: { slug: true, title: true, difficulty: true, language: true } },
          participants: { select: PARTICIPANT_SELECT },
        },
      }),
    );

    // Confirming an id exists is itself a leak, so a stranger and a missing
    // battle get the same answer.
    if (!battle || !battle.participants.some((participant) => participant.userId === userId)) {
      throw new NotFoundException('Battle not found');
    }
    if (battle.state !== 'COMPLETE') {
      throw new NotFoundException('This battle has no results yet');
    }

    const standings = battle.participants
      .map((participant) => toStanding(participant, userId))
      // Ranked players first and in order; everyone who never handed in
      // follows, since they were not in the running at all.
      .sort((a, b) => (a.rank ?? Infinity) - (b.rank ?? Infinity) || a.username.localeCompare(b.username));

    const mine = battle.participants.find((participant) => participant.userId === userId);

    return {
      battleId,
      completedAt: battle.completedAt?.toISOString() ?? null,
      fieldSize: battle.finalPlayerCount ?? standings.filter((entry) => entry.rank !== null).length,
      problem: battle.problem,
      winnerUserId: winnerFrom(standings),
      standings,
      myCases: readCases(mine?.submission?.judgement?.cases),
      // A runner that cannot measure CPU time reports no timing at all, and
      // the ladder falls through to submit time. Saying so beats an empty
      // column that looks like a bug.
      timingsMeasured: standings.some((entry) => entry.runtimeMs !== null),
    };
  }
}

type ParticipantRow = {
  userId: string;
  state: string;
  isGhost: boolean;
  rank: number | null;
  decidedBy: string | null;
  invalidatedAt: Date | null;
  invalidatedReason: string;
  user: { username: string; name: string; avatarUrl: string; customAvatarUrl: string };
  submission: {
    submittedAt: Date | null;
    telemetry: unknown;
    judgement: {
      state: string;
      passedGate: boolean;
      passedTests: number;
      totalTests: number;
      runtimeMs: number | null;
      memoryKb: number | null;
      cases: unknown;
    } | null;
  } | null;
};

function toStanding(participant: ParticipantRow, viewerId: string): Standing {
  const judgement = participant.submission?.judgement;
  const judged = judgement?.state === 'COMPLETE';

  return {
    userId: participant.userId,
    username: participant.user.username,
    name: participant.user.name || participant.user.username,
    avatarUrl: displayAvatar(participant.user),
    rank: participant.rank,
    decidedBy: participant.decidedBy,
    submitted: participant.state === 'SUBMITTED',
    passedGate: judged ? judgement.passedGate : false,
    passedTests: judged ? judgement.passedTests : 0,
    totalTests: judged ? judgement.totalTests : 0,
    runtimeMs: judged ? judgement.runtimeMs : null,
    memoryKb: judged ? judgement.memoryKb : null,
    submittedAt: participant.submission?.submittedAt?.toISOString() ?? null,
    isMe: participant.userId === viewerId,
    isGhost: participant.isGhost,
    invalidated: Boolean(participant.invalidatedAt),
    invalidatedReason: participant.invalidatedReason ?? '',
    focusLosses: sanitiseTelemetry(participant.submission?.telemetry)?.focusLosses ?? null,
  };
}

/**
 * First place, when exactly one person holds it.
 *
 * A shared first is a draw, and a field where nothing passed has no winner
 * rather than a least-bad one - the same rule the ladder applied.
 */
function winnerFrom(standings: Standing[]): string | null {
  const firsts = standings.filter((entry) => entry.rank === 1 && !entry.invalidated);
  return firsts.length === 1 && firsts[0].passedGate ? firsts[0].userId : null;
}

/** Judgements written before per-case results were stored have none. */
function readCases(stored: unknown): CaseOutcome[] {
  return Array.isArray(stored) ? (stored as CaseOutcome[]) : [];
}
