import { describe, expect, it } from 'vitest';
import {
  EMPTY_RECORD,
  opponentsBeatenBy,
  RecordedBattle,
  recordSummary,
  summarise,
} from '../../src/modules/battles/battle-record';

const battle = (overrides: Partial<RecordedBattle> = {}): RecordedBattle => ({
  rank: 1,
  fieldSize: 2,
  invalidated: false,
  ghost: false,
  ...overrides,
});

describe('how many people one placing beat', () => {
  it('is the field behind you, not the height of the placing', () => {
    expect(opponentsBeatenBy(1, 2)).toBe(1);
    expect(opponentsBeatenBy(3, 20)).toBe(17);
  });

  it('is nothing for last place', () => {
    expect(opponentsBeatenBy(20, 20)).toBe(0);
  });

  it('refuses to invent people from nonsense', () => {
    expect(opponentsBeatenBy(0, 5)).toBe(0);
    expect(opponentsBeatenBy(-1, 5)).toBe(0);
    expect(opponentsBeatenBy(1, 0)).toBe(0);
  });
});

describe('the record a profile shows', () => {
  it('is empty rather than absent for somebody who has never played', () => {
    expect(summarise([])).toEqual(EMPTY_RECORD);
  });

  it('puts third of twenty above winning a one-on-one', () => {
    // The whole reason this is not a win count: one of those results took
    // outperforming seventeen people and the other took outperforming one
    const bigField = summarise([battle({ rank: 3, fieldSize: 20 })]);
    const headToHead = summarise([battle({ rank: 1, fieldSize: 2 })]);

    expect(bigField.opponentsBeaten).toBe(17);
    expect(headToHead.opponentsBeaten).toBe(1);
    expect(bigField.opponentsBeaten).toBeGreaterThan(headToHead.opponentsBeaten);
    // And the win count would have said the opposite
    expect(headToHead.wins).toBeGreaterThan(bigField.wins);
  });

  it('adds up across battles', () => {
    const record = summarise([
      battle({ rank: 1, fieldSize: 4 }),
      battle({ rank: 2, fieldSize: 6 }),
      battle({ rank: 5, fieldSize: 5 }),
    ]);

    expect(record.battles).toBe(3);
    expect(record.opponentsBeaten).toBe(3 + 4 + 0);
    expect(record.wins).toBe(1);
    expect(record.podiums).toBe(2);
  });

  it('counts a top-three finish as a podium, and fourth as not', () => {
    expect(summarise([battle({ rank: 3, fieldSize: 10 })]).podiums).toBe(1);
    expect(summarise([battle({ rank: 4, fieldSize: 10 })]).podiums).toBe(0);
  });

  describe('the best finish', () => {
    it('is the one that beat the most people, not the highest placing', () => {
      // A "best finish" of 1st of 2 printed above "ahead of 17 developers"
      // would contradict itself
      const record = summarise([
        battle({ rank: 1, fieldSize: 2 }),
        battle({ rank: 3, fieldSize: 20 }),
      ]);
      expect(record.bestFinish).toEqual({ rank: 3, fieldSize: 20 });
    });

    it('prefers the bigger field between equal placings', () => {
      const record = summarise([
        battle({ rank: 2, fieldSize: 3 }),
        battle({ rank: 2, fieldSize: 20 }),
      ]);
      expect(record.bestFinish).toEqual({ rank: 2, fieldSize: 20 });
    });

    it('breaks a genuine tie on the better placing', () => {
      // First of three and third of five both left two people behind, and
      // the win is the better story
      const record = summarise([
        battle({ rank: 3, fieldSize: 5 }),
        battle({ rank: 1, fieldSize: 3 }),
      ]);
      expect(record.bestFinish).toEqual({ rank: 1, fieldSize: 3 });
    });

    it('is nothing when nothing was ever ranked', () => {
      expect(summarise([battle({ rank: null })]).bestFinish).toBeNull();
    });
  });

  describe('what it refuses to count', () => {
    it('an invalidated result counts for nothing, but is still shown', () => {
      // Hiding it would hide the consequence, which is the opposite of the point
      const record = summarise([
        battle({ rank: 1, fieldSize: 10, invalidated: true }),
        battle({ rank: 2, fieldSize: 5 }),
      ]);

      expect(record.invalidated).toBe(1);
      expect(record.battles).toBe(1);
      expect(record.opponentsBeaten).toBe(3);
      expect(record.wins).toBe(0);
      expect(record.bestFinish).toEqual({ rank: 2, fieldSize: 5 });
    });

    it('a ghost battle, because nobody was on the other side', () => {
      // Ghosts are unlimited and the difficulty is the player's own choice,
      // so counting them would make the number farmable
      const record = summarise([battle({ rank: 1, fieldSize: 2, ghost: true })]);

      expect(record.ghostBattles).toBe(1);
      expect(record.battles).toBe(0);
      expect(record.opponentsBeaten).toBe(0);
    });

    it('a battle nobody was ranked in', () => {
      const record = summarise([battle({ rank: null, fieldSize: 4 })]);
      expect(record.battles).toBe(0);
    });

    it('an invalidated ghost is counted once, as invalidated', () => {
      const record = summarise([battle({ invalidated: true, ghost: true })]);
      expect(record.invalidated).toBe(1);
      expect(record.ghostBattles).toBe(0);
    });
  });
});

describe('the line on the badge', () => {
  it('says the number and what it means', () => {
    // "17" alone reads as a score out of something
    const record = summarise([battle({ rank: 3, fieldSize: 20 })]);
    expect(recordSummary(record)).toBe('Finished ahead of 17 developers across 1 battle');
  });

  it('gets the singular right for one person', () => {
    const record = summarise([battle({ rank: 1, fieldSize: 2 })]);
    expect(recordSummary(record)).toBe('Finished ahead of 1 developer across 1 battle');
  });

  it('says plainly when there is nothing yet', () => {
    expect(recordSummary(EMPTY_RECORD)).toBe('No battles yet');
  });

  it('distinguishes somebody who has only practised', () => {
    const record = summarise([battle({ ghost: true })]);
    expect(recordSummary(record)).toMatch(/practising/i);
  });
});
