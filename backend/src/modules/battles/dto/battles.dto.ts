import {
  ArrayMaxSize,
  ArrayMinSize,
  IsArray,
  IsIn,
  IsInt,
  IsObject,
  IsOptional,
  IsString,
  IsUUID,
  Matches,
  Max,
  MaxLength,
  Min,
} from 'class-validator';
import { Type } from 'class-transformer';
import { GITHUB_OWNER_PATTERN } from '../../../common/utils/github-pattern';
import {
  BATTLE_DIFFICULTIES,
  BATTLE_DURATION_SECONDS,
  MAX_BATTLE_CAPACITY,
  MIN_BATTLE_CAPACITY,
} from '../battle.state';

export class CreatePrivateBattleDto {
  /**
   * The creator picks a pool, not a problem. Letting them choose the problem
   * would hand them one they may already have solved.
   */
  @IsIn(BATTLE_DIFFICULTIES as unknown as string[])
  difficulty!: string;

  @IsString()
  @MaxLength(40)
  language!: string;

  /** Total seats including the creator, so at most capacity - 1 invitees. */
  @Type(() => Number)
  @IsInt()
  @Min(MIN_BATTLE_CAPACITY)
  @Max(MAX_BATTLE_CAPACITY)
  capacity!: number;

  @Type(() => Number)
  @IsInt()
  @IsIn(BATTLE_DURATION_SECONDS as unknown as number[])
  durationSeconds!: number;

  /** GitHub usernames. Each must be someone the creator follows. */
  @IsArray()
  @ArrayMinSize(1)
  @ArrayMaxSize(MAX_BATTLE_CAPACITY - 1)
  @IsString({ each: true })
  @Matches(GITHUB_OWNER_PATTERN, { each: true, message: 'invitees must be valid GitHub usernames' })
  invitees!: string[];
}

/**
 * A public battle, which anybody may join.
 *
 * The same shape as a private one without the invitees: there is nobody to
 * name, because the lobby is open to whoever finds it.
 */
export class CreatePublicBattleDto {
  @IsIn(BATTLE_DIFFICULTIES as unknown as string[])
  difficulty!: string;

  @IsString()
  @MaxLength(40)
  language!: string;

  @Type(() => Number)
  @IsInt()
  @Min(MIN_BATTLE_CAPACITY)
  @Max(MAX_BATTLE_CAPACITY)
  capacity!: number;

  @Type(() => Number)
  @IsInt()
  @IsIn(BATTLE_DURATION_SECONDS as unknown as number[])
  durationSeconds!: number;
}

/** A race against a stored submission. There is nobody to invite or wait for. */
/**
 * Asking the queue for a battle. The same three choices as a ghost, because
 * the queue falls back to one and the ask must not change shape when it does.
 */
export class JoinBattleQueueDto {
  @IsIn(BATTLE_DIFFICULTIES as unknown as string[])
  difficulty!: string;

  @IsString()
  @MaxLength(40)
  language!: string;

  @Type(() => Number)
  @IsInt()
  @IsIn(BATTLE_DURATION_SECONDS as unknown as number[])
  durationSeconds!: number;
}

export class StartGhostBattleDto {
  @IsIn(BATTLE_DIFFICULTIES as unknown as string[])
  difficulty!: string;

  @IsString()
  @MaxLength(40)
  language!: string;

  @Type(() => Number)
  @IsInt()
  @IsIn(BATTLE_DURATION_SECONDS as unknown as number[])
  durationSeconds!: number;
}

/** A solution is a few hundred lines at most; the cap is there to stop abuse. */
export const MAX_SOLUTION_LENGTH = 64_000;

export class SaveDraftDto {
  @IsString()
  @MaxLength(MAX_SOLUTION_LENGTH)
  code!: string;

  /**
   * How the code arrived, from the player's own browser.
   *
   * Left loose here and narrowed in `sanitiseTelemetry`, which is the one
   * place that decides what may be stored: only known keys, only finite
   * numbers, all clamped. Validating it twice in two shapes would mean two
   * things to keep in step.
   */
  @IsOptional()
  @IsObject()
  telemetry?: Record<string, unknown>;
}

/**
 * A reviewer's decision on a similarity flag.
 *
 * The participants to invalidate are named rather than inferred: the
 * measurement cannot tell who copied whom, and taking the placing off
 * somebody who did the work would be the worse mistake.
 */
export class ResolveFlagDto {
  @IsIn(['CONFIRMED', 'CLEARED'])
  action!: 'CONFIRMED' | 'CLEARED';

  @IsOptional()
  @IsArray()
  @IsUUID('4', { each: true })
  invalidate?: string[];

  @IsOptional()
  @IsArray()
  @IsUUID('4', { each: true })
  ban?: string[];

  @IsOptional()
  @IsString()
  @MaxLength(2000)
  note?: string;
}
