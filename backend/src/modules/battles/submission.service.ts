import { EventsService } from '../events/events.service';
import { Optional } from '@nestjs/common';
import { BadRequestException, Inject, Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService, withDbRetry } from '../../database/prisma.service';
import { BattleTimerService } from './battle-timer.service';
import { EnforcementService } from './enforcement.service';
import { sanitiseTelemetry } from './telemetry';
import { hasDeadlinePassed } from './battle.state';

export interface DraftView {
  /** Empty when nothing has been saved yet; the editor falls back to the starter code. */
  code: string;
  language: string;
  savedAt: string | null;
  submittedAt: string | null;
  endsAt: string | null;
  secondsRemaining: number;
}

/**
 * Loaded in one round trip: the battle, its clock, and only this player's row.
 */
const WORKSPACE_SELECT = (userId: string) =>
  ({
    state: true,
    endsAt: true,
    problem: { select: { language: true } },
    participants: {
      where: { userId },
      select: {
        id: true,
        state: true,
        submission: { select: { code: true, submittedAt: true, updatedAt: true } },
      },
    },
  }) as const;

/**
 * Drafts and submissions.
 *
 * The clock is checked here on every write rather than trusted from the
 * battle's state: the sweep that closes a finished battle runs on an interval,
 * so for up to half a minute a battle whose time is up still reads as ACTIVE.
 * Accepting work in that window would hand a player extra seconds.
 */
@Injectable()
export class SubmissionService {
  constructor(
    @Inject(PrismaService) private readonly prisma: PrismaService,
    @Inject(BattleTimerService) private readonly timers: BattleTimerService,
    @Inject(EnforcementService) private readonly enforcement: EnforcementService,
    @Optional() @Inject(EventsService) private readonly events?: EventsService,
  ) {}

  /** Whatever this player has in progress, plus how long they have left. */
  public async getDraft(battleId: string, userId: string): Promise<DraftView> {
    const { battle, participant } = await this.loadWorkspace(battleId, userId);
    return toDraftView(battle, participant);
  }

  /**
   * Autosave. Overwrites the single row this player owns for this battle, so
   * a crashed tab or a refresh loses at most the last few seconds of typing.
   */
  public async saveDraft(battleId: string, userId: string, code: string): Promise<DraftView> {
    const { battle, participant } = await this.loadWorkspace(battleId, userId);
    this.assertStillWorking(battle, participant);

    const saved = await withDbRetry(() =>
      this.prisma.submission.upsert({
        where: { participantId: participant.id },
        update: { code },
        create: { participantId: participant.id, code, language: battle.problem?.language ?? '' },
        select: { code: true, submittedAt: true, updatedAt: true },
      }),
    );

    return toDraftView(battle, { submission: saved });
  }

  /**
   * Hands the work in. After this the player cannot edit again, and if they
   * were the last one still working the battle closes immediately rather than
   * making everyone watch the clock run down.
   */
  public async submit(
    battleId: string,
    userId: string,
    code: string,
    telemetry?: unknown,
  ): Promise<DraftView> {
    const { battle, participant } = await this.loadWorkspace(battleId, userId);
    this.assertStillWorking(battle, participant);

    if (!code.trim()) {
      throw new BadRequestException('There is nothing to submit');
    }

    // Every submission is a sandbox run, and the sandbox is one small
    // machine. Checked here rather than in the queue so the refusal reaches
    // the person who is about to spend it, while they can still see it.
    await this.enforcement.assertUnderDailyCap(userId);

    const submittedAt = new Date();
    // Narrowed here rather than trusted: the column takes known counters only,
    // so a client cannot put text in it by sending text.
    const signals = sanitiseTelemetry(telemetry);

    const saved = await withDbRetry(() =>
      this.prisma.submission.upsert({
        where: { participantId: participant.id },
        update: { code, submittedAt, ...(signals ? { telemetry: signals } : {}) },
        create: {
          participantId: participant.id,
          code,
          language: battle.problem?.language ?? '',
          submittedAt,
          ...(signals ? { telemetry: signals } : {}),
        },
        select: { code: true, submittedAt: true, updatedAt: true },
      }),
    );

    await withDbRetry(() =>
      this.prisma.battleParticipant.update({ where: { id: participant.id }, data: { state: 'SUBMITTED' } }),
    );

    // Nobody left working means there is nothing to wait for
    await this.timers.closeIfEveryoneSubmitted(battleId, submittedAt);
    void this.events?.notify('battle.changed', battleId);

    return toDraftView(battle, { submission: saved });
  }

  /** Unique-ID findFirst avoids the Prisma 6.4.1 batching panic; seat scoping remains mandatory. */
  private async loadWorkspace(battleId: string, userId: string) {
    const battle = await withDbRetry(() =>
      this.prisma.battle.findFirst({ where: { id: battleId }, select: WORKSPACE_SELECT(userId), relationLoadStrategy: 'join' }),
    );
    if (!battle || battle.participants.length === 0) {
      throw new NotFoundException('Battle not found');
    }
    return { battle, participant: battle.participants[0] };
  }

  private assertStillWorking(
    battle: { state: string; endsAt: Date | null },
    participant: { state: string },
  ): void {
    if (battle.state !== 'ACTIVE') {
      throw new BadRequestException('This battle is not running');
    }
    // The state alone is not enough: the sweep may not have run yet
    if (hasDeadlinePassed(battle.endsAt)) {
      throw new BadRequestException('Time is up for this battle');
    }
    if (participant.state === 'SUBMITTED') {
      throw new BadRequestException('You have already handed this in');
    }
    if (participant.state !== 'JOINED') {
      throw new BadRequestException('You are not competing in this battle');
    }
  }
}

function toDraftView(
  battle: { endsAt: Date | null; problem: { language: string } | null },
  participant: { submission: { code: string; submittedAt: Date | null; updatedAt: Date } | null },
): DraftView {
  const remainingMs = battle.endsAt ? battle.endsAt.getTime() - Date.now() : 0;

  return {
    code: participant.submission?.code ?? '',
    language: battle.problem?.language ?? '',
    savedAt: participant.submission?.updatedAt?.toISOString() ?? null,
    submittedAt: participant.submission?.submittedAt?.toISOString() ?? null,
    endsAt: battle.endsAt?.toISOString() ?? null,
    secondsRemaining: Math.max(0, Math.floor(remainingMs / 1000)),
  };
}
