import { describe, expect, it } from 'vitest';
import type { BattleState } from '@prisma/client';
import type { ParticipantState } from '@prisma/client';
import {
  BATTLE_DURATION_SECONDS,
  BATTLE_TRANSITIONS,
  battleEndFrom,
  canParticipantTransition,
  canTransition,
  contenders,
  endStateFor,
  everyoneSubmitted,
  hasDeadlinePassed,
  isLobby,
  isWalkover,
  isTerminal,
  isValidCapacity,
  isValidDuration,
  lobbyExpiryFrom,
  MAX_BATTLE_CAPACITY,
  MIN_BATTLE_CAPACITY,
  openingState,
  rankedFieldSize,
} from '../../src/modules/battles/battle.state';

describe('battle lifecycle', () => {
  it('routes public and private battles out of CREATED differently', () => {
    expect(openingState('PUBLIC')).toBe('OPEN');
    expect(openingState('PRIVATE')).toBe('INVITED');
  });

  it('lets both lobby kinds reach the same ACTIVE state', () => {
    // One engine, two matchmaking modes: the paths converge immediately
    expect(canTransition('OPEN', 'ACTIVE')).toBe(true);
    expect(canTransition('INVITED', 'ACTIVE')).toBe(true);
  });

  it('walks a full battle from creation to completion', () => {
    const path: BattleState[] = ['CREATED', 'OPEN', 'ACTIVE', 'SUBMITTED', 'JUDGING', 'COMPLETE'];
    for (let i = 0; i < path.length - 1; i++) {
      expect(canTransition(path[i], path[i + 1]), `${path[i]} -> ${path[i + 1]}`).toBe(true);
    }
  });

  it('refuses to skip judging or to start from nothing', () => {
    expect(canTransition('SUBMITTED', 'COMPLETE')).toBe(false);
    expect(canTransition('CREATED', 'ACTIVE')).toBe(false);
    expect(canTransition('ACTIVE', 'JUDGING')).toBe(false);
  });

  it('allows a lobby to expire but not a running battle', () => {
    expect(canTransition('OPEN', 'EXPIRED')).toBe(true);
    expect(canTransition('INVITED', 'EXPIRED')).toBe(true);
    // A battle that actually started is abandoned, never expired
    expect(canTransition('ACTIVE', 'EXPIRED')).toBe(false);
    expect(canTransition('ACTIVE', 'ABANDONED')).toBe(true);
  });

  it('never leaves a terminal state', () => {
    for (const state of ['COMPLETE', 'EXPIRED', 'ABANDONED'] as const) {
      expect(isTerminal(state)).toBe(true);
      expect(BATTLE_TRANSITIONS[state]).toEqual([]);
    }
  });

  it('knows which states are still taking players', () => {
    expect(isLobby('OPEN')).toBe(true);
    expect(isLobby('INVITED')).toBe(true);
    expect(isLobby('ACTIVE')).toBe(false);
    expect(isLobby('COMPLETE')).toBe(false);
  });
});

describe('participant lifecycle', () => {
  it('lets an invitee accept or decline', () => {
    expect(canParticipantTransition('INVITED', 'JOINED')).toBe(true);
    expect(canParticipantTransition('INVITED', 'REJECTED')).toBe(true);
  });

  it('allows leaving and coming back', () => {
    expect(canParticipantTransition('JOINED', 'LEFT')).toBe(true);
    expect(canParticipantTransition('LEFT', 'JOINED')).toBe(true);
  });

  it('closes the door once a submission is in', () => {
    expect(canParticipantTransition('SUBMITTED', 'LEFT')).toBe(false);
    expect(canParticipantTransition('SUBMITTED', 'JOINED')).toBe(false);
    expect(canParticipantTransition('REJECTED', 'JOINED')).toBe(false);
  });
});

describe('battle settings', () => {
  it('requires at least two players', () => {
    // A solo battle would be a free win for whoever created it
    expect(isValidCapacity(1)).toBe(false);
    expect(isValidCapacity(MIN_BATTLE_CAPACITY)).toBe(true);
  });

  it('caps the field at twenty', () => {
    expect(isValidCapacity(MAX_BATTLE_CAPACITY)).toBe(true);
    expect(isValidCapacity(21)).toBe(false);
  });

  it('rejects fractional or absurd capacities', () => {
    expect(isValidCapacity(4.5)).toBe(false);
    expect(isValidCapacity(0)).toBe(false);
    expect(isValidCapacity(-3)).toBe(false);
  });

  it('accepts only the offered durations', () => {
    for (const seconds of BATTLE_DURATION_SECONDS) {
      expect(isValidDuration(seconds)).toBe(true);
    }
    expect(isValidDuration(15 * 60)).toBe(true);
    expect(isValidDuration(3 * 60)).toBe(true);
    expect(isValidDuration(5 * 60)).toBe(true);
    expect(isValidDuration(10 * 60)).toBe(true);
    expect(isValidDuration(61)).toBe(false);
    expect(isValidDuration(90 * 60)).toBe(false);
  });
});

describe('clocks', () => {
  it('kills an unstarted lobby four hours after creation', () => {
    const created = new Date('2026-01-01T10:00:00Z');
    expect(lobbyExpiryFrom(created).toISOString()).toBe('2026-01-01T14:00:00.000Z');
  });

  it('gives everyone the same deadline from the moment the creator starts', () => {
    // The creator opened the lobby at 10:00 and waited; nobody is penalised
    // for that wait because the clock only begins at start.
    const startedAt = new Date('2026-01-01T10:40:00Z');
    expect(battleEndFrom(startedAt, 30 * 60).toISOString()).toBe('2026-01-01T11:10:00.000Z');
    expect(battleEndFrom(startedAt, 60 * 60).toISOString()).toBe('2026-01-01T11:40:00.000Z');
  });
});

describe('how a running battle ends', () => {
  const states = (...list: ParticipantState[]) => list;

  it('goes to judging when there is anything to judge', () => {
    expect(endStateFor(states('SUBMITTED', 'SUBMITTED'))).toBe('SUBMITTED');
    expect(endStateFor(states('SUBMITTED', 'JOINED'))).toBe('SUBMITTED');
  });

  it('is abandoned when nobody handed anything in', () => {
    expect(endStateFor(states('JOINED', 'JOINED'))).toBe('ABANDONED');
    expect(endStateFor(states('JOINED', 'LEFT'))).toBe('ABANDONED');
    expect(endStateFor(states())).toBe('ABANDONED');
  });

  it('counts only the people still in the running', () => {
    // Someone who declined or walked away is not waited for
    expect(contenders(states('JOINED', 'SUBMITTED', 'LEFT', 'REJECTED', 'INVITED'))).toEqual([
      'JOINED',
      'SUBMITTED',
    ]);
  });
});

describe('closing early', () => {
  const states = (...list: ParticipantState[]) => list;

  it('closes once every contender has submitted', () => {
    expect(everyoneSubmitted(states('SUBMITTED', 'SUBMITTED'))).toBe(true);
  });

  it('does not wait for someone who left or never accepted', () => {
    expect(everyoneSubmitted(states('SUBMITTED', 'LEFT'))).toBe(true);
    expect(everyoneSubmitted(states('SUBMITTED', 'REJECTED', 'INVITED'))).toBe(true);
  });

  it('keeps waiting while anyone is still working', () => {
    expect(everyoneSubmitted(states('SUBMITTED', 'JOINED'))).toBe(false);
  });

  it('never closes a battle nobody submitted to', () => {
    expect(everyoneSubmitted(states('JOINED', 'JOINED'))).toBe(false);
    expect(everyoneSubmitted(states('LEFT', 'REJECTED'))).toBe(false);
    expect(everyoneSubmitted(states())).toBe(false);
  });
});

describe('walkovers', () => {
  const states = (...list: ParticipantState[]) => list;

  it('is a walkover when one player submits and the others do not', () => {
    // Counting this as a win would reward hunting for opponents who drop out
    expect(isWalkover(states('SUBMITTED', 'JOINED'))).toBe(true);
  });

  it('is not a walkover when the opponent submitted too', () => {
    expect(isWalkover(states('SUBMITTED', 'SUBMITTED'))).toBe(false);
  });

  it('is not a walkover when there was never anyone else in the running', () => {
    expect(isWalkover(states('SUBMITTED'))).toBe(false);
    expect(isWalkover(states('SUBMITTED', 'REJECTED'))).toBe(false);
  });

  it('is not a walkover when nobody submitted at all', () => {
    expect(isWalkover(states('JOINED', 'JOINED'))).toBe(false);
  });

  it('ranks across the submissions, not the seats', () => {
    expect(rankedFieldSize(states('SUBMITTED', 'SUBMITTED', 'JOINED', 'REJECTED'))).toBe(2);
    expect(rankedFieldSize(states('JOINED'))).toBe(0);
  });
});

describe('the deadline', () => {
  const at = (iso: string) => new Date(iso);

  it('is past once the clock reaches it', () => {
    expect(hasDeadlinePassed(at('2026-01-01T11:10:00Z'), at('2026-01-01T11:10:00Z'))).toBe(true);
    expect(hasDeadlinePassed(at('2026-01-01T11:10:00Z'), at('2026-01-01T11:10:01Z'))).toBe(true);
  });

  it('is not past a second before', () => {
    expect(hasDeadlinePassed(at('2026-01-01T11:10:00Z'), at('2026-01-01T11:09:59Z'))).toBe(false);
  });

  it('treats a battle that never started as having no deadline', () => {
    expect(hasDeadlinePassed(null)).toBe(false);
  });
});
