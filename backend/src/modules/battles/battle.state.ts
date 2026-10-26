import { BattleState, BattleVisibility, ParticipantState } from '@prisma/client';

/**
 * The battle lifecycle, written down once.
 *
 * Public and private battles run on the same engine: the only difference is the
 * route out of CREATED (OPEN for public, INVITED for private). Everything from
 * ACTIVE onwards is shared, which is what lets tournaments, team battles and
 * spectator mode be new entry paths later rather than new systems.
 *
 *   CREATED ─┬─> OPEN ────┬─> ACTIVE ─> SUBMITTED ─> JUDGING ─> COMPLETE
 *            └─> INVITED ─┘     │
 *            │                  └─> ABANDONED   (started, nothing handed in)
 *            └─────────────────────> EXPIRED    (never started in time)
 */
export const BATTLE_TRANSITIONS: Readonly<Record<BattleState, readonly BattleState[]>> = {
  CREATED: ['OPEN', 'INVITED', 'EXPIRED'],
  OPEN: ['ACTIVE', 'EXPIRED'],
  INVITED: ['ACTIVE', 'EXPIRED'],
  ACTIVE: ['SUBMITTED', 'ABANDONED'],
  SUBMITTED: ['JUDGING'],
  JUDGING: ['COMPLETE'],
  COMPLETE: [],
  EXPIRED: [],
  ABANDONED: [],
} as const;

/** States a battle can never leave. */
export const TERMINAL_BATTLE_STATES: readonly BattleState[] = ['COMPLETE', 'EXPIRED', 'ABANDONED'];

/** States in which a lobby is still waiting for people. */
export const LOBBY_BATTLE_STATES: readonly BattleState[] = ['CREATED', 'OPEN', 'INVITED'];

export const PARTICIPANT_TRANSITIONS: Readonly<Record<ParticipantState, readonly ParticipantState[]>> = {
  INVITED: ['JOINED', 'REJECTED'],
  // Leaving is allowed, and rejoining is too - but the clock does not restart
  JOINED: ['SUBMITTED', 'LEFT'],
  LEFT: ['JOINED'],
  SUBMITTED: [],
  REJECTED: [],
} as const;

/** The state a freshly created battle moves into, by visibility. */
export function openingState(visibility: BattleVisibility): BattleState {
  return visibility === 'PUBLIC' ? 'OPEN' : 'INVITED';
}

export function canTransition(from: BattleState, to: BattleState): boolean {
  return BATTLE_TRANSITIONS[from].includes(to);
}

export function canParticipantTransition(from: ParticipantState, to: ParticipantState): boolean {
  return PARTICIPANT_TRANSITIONS[from].includes(to);
}

export function isTerminal(state: BattleState): boolean {
  return TERMINAL_BATTLE_STATES.includes(state);
}

/** True while the battle is still accepting players. */
export function isLobby(state: BattleState): boolean {
  return LOBBY_BATTLE_STATES.includes(state);
}

/** Lobbies die four hours after creation if the creator never starts them. */
export const LOBBY_TTL_SECONDS = 4 * 60 * 60;

/** A creator picks one of these when creating the battle; they cannot end it early. */
export const BATTLE_DURATION_SECONDS = [180, 300, 600, 900, 1800, 2700, 3600] as const;
export type BattleDurationSeconds = (typeof BATTLE_DURATION_SECONDS)[number];

/**
 * Capacity bounds. The floor is two on purpose: a one-player battle would let
 * the creator start alone and collect a free win.
 */
export const MIN_BATTLE_CAPACITY = 2;
export const MAX_BATTLE_CAPACITY = 20;

/** The pools a creator may draw a battle from. */
export const BATTLE_DIFFICULTIES = ['easy', 'medium', 'hard'] as const;
export type BattleDifficulty = (typeof BATTLE_DIFFICULTIES)[number];

export function isValidDifficulty(value: string): value is BattleDifficulty {
  return (BATTLE_DIFFICULTIES as readonly string[]).includes(value);
}

/**
 * Picks the problem for a battle.
 *
 * Drawn at start rather than chosen at creation: a creator who picks the
 * problem knows it in advance, which is a larger advantage than anything the
 * scoring can introduce.
 */
export function drawProblemId(candidateIds: string[]): string | null {
  if (candidateIds.length === 0) return null;
  return candidateIds[Math.floor(Math.random() * candidateIds.length)];
}

/**
 * How many battles of each kind one account may create per week.
 *
 * Creating is capped and joining is not, which is the whole shape of the
 * limit: it stops one account filling the lobby list, without stopping
 * anybody from playing. Ghost battles are not counted - they exist so that
 * somebody alone at three in the morning still has something to play.
 */
export const WEEKLY_BATTLE_CREATION_LIMIT = { public: 2, private: 2 } as const;

export const CREATION_WINDOW_MS = 7 * 24 * 60 * 60 * 1000;

/** The moment a creation limit is measured back to. */
export function creationWindowStart(now: Date = new Date()): Date {
  return new Date(now.getTime() - CREATION_WINDOW_MS);
}

export function isValidCapacity(capacity: number): boolean {
  return Number.isInteger(capacity) && capacity >= MIN_BATTLE_CAPACITY && capacity <= MAX_BATTLE_CAPACITY;
}

export function isValidDuration(seconds: number): seconds is BattleDurationSeconds {
  return (BATTLE_DURATION_SECONDS as readonly number[]).includes(seconds);
}

/** Participants still in the running: they joined and have not walked away. */
export function contenders(states: readonly ParticipantState[]): ParticipantState[] {
  return states.filter((state) => state === 'JOINED' || state === 'SUBMITTED');
}

/**
 * Where a running battle goes when its clock stops.
 *
 * Something to judge means SUBMITTED; nothing handed in at all means the
 * battle was ABANDONED and there is no winner.
 */
export function endStateFor(states: readonly ParticipantState[]): BattleState {
  return states.some((state) => state === 'SUBMITTED') ? 'SUBMITTED' : 'ABANDONED';
}

/**
 * True once nobody is still working: every contender has handed in.
 *
 * This is the only early end there is. A creator who could stop the battle
 * would submit and cut everyone else off, so the clock is the only other way
 * out. Someone who left is not waited for.
 */
export function everyoneSubmitted(states: readonly ParticipantState[]): boolean {
  const remaining = contenders(states);
  return remaining.length > 0 && remaining.every((state) => state === 'SUBMITTED');
}

/**
 * A win nobody contested: one player handed in and the rest did not.
 *
 * Kept separate from a real win. Counting walkovers would reward finding
 * opponents who drop out rather than opponents who are hard to beat.
 */
export function isWalkover(states: readonly ParticipantState[]): boolean {
  const submitted = states.filter((state) => state === 'SUBMITTED').length;
  return submitted === 1 && contenders(states).length > 1;
}

/** How many submissions a result is ranked across. */
export function rankedFieldSize(states: readonly ParticipantState[]): number {
  return states.filter((state) => state === 'SUBMITTED').length;
}

/** The server clock decides, never the browser's. */
export function hasDeadlinePassed(endsAt: Date | null, now: Date = new Date()): boolean {
  return endsAt !== null && endsAt.getTime() <= now.getTime();
}

/** When a lobby created now stops accepting a start. */
export function lobbyExpiryFrom(createdAt: Date): Date {
  return new Date(createdAt.getTime() + LOBBY_TTL_SECONDS * 1000);
}

/**
 * The single shared deadline for everyone in the battle.
 *
 * Every participant races the same clock from the moment the creator starts,
 * so someone who joined the lobby early is not penalised for waiting.
 */
export function battleEndFrom(startedAt: Date, durationSeconds: number): Date {
  return new Date(startedAt.getTime() + durationSeconds * 1000);
}
