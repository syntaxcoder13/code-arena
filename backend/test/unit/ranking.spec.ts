import { describe, expect, it } from 'vitest';
import {
  Contender,
  rankContenders,
  RUNTIME_TIE_BAND,
  timingTiers,
  winnerOf,
} from '../../src/modules/battles/ranking';

const at = (minute: number) => new Date(`2026-01-01T10:${String(minute).padStart(2, '0')}:00Z`);

function contender(id: string, overrides: Partial<Contender> = {}): Contender {
  return {
    participantId: id,
    passedGate: true,
    passedTests: 8,
    totalTests: 8,
    runtimeMs: 100,
    memoryKb: 4000,
    submittedAt: at(10),
    ...overrides,
  };
}

const order = (contenders: Contender[]) => rankContenders(contenders).map((entry) => entry.participantId);
const ranks = (contenders: Contender[]) => rankContenders(contenders).map((entry) => entry.rank);

describe('timing tiers', () => {
  it('keeps timings within the band in one tier', () => {
    // 100 and 110 are 10% apart: the sandbox is not precise enough to call that
    expect(timingTiers([100, 110])).toEqual([0, 0]);
  });

  it('splits once the band is exceeded', () => {
    expect(timingTiers([100, 130])).toEqual([0, 1]);
  });

  it('is transitive, which a bare 15% comparison is not', () => {
    // 100~110 and 110~125 are each within the band, but 100 and 125 are not.
    // Comparing pairwise would order these differently depending on the order
    // they happened to be seen in; bucketing from the fastest does not.
    expect(timingTiers([100, 110, 125])).toEqual([0, 0, 1]);
  });

  it('measures each tier from its own fastest, not from the previous entry', () => {
    // Otherwise 100, 114, 129, 147 would creep into one endless tier
    expect(timingTiers([100, 114, 129, 147])).toEqual([0, 0, 1, 1]);
  });

  it('handles one timing and none at all', () => {
    expect(timingTiers([100])).toEqual([0]);
    expect(timingTiers([])).toEqual([]);
  });

  it('uses the band that is documented', () => {
    expect(timingTiers([100, 100 * (1 + RUNTIME_TIE_BAND)])).toEqual([0, 0]);
    expect(timingTiers([100, 100 * (1 + RUNTIME_TIE_BAND) + 1])).toEqual([0, 1]);
  });
});

describe('the gate', () => {
  it('puts everyone who passed above everyone who did not', () => {
    // However fast a wrong answer is, it is still wrong
    expect(
      order([
        contender('wrong', { passedGate: false, passedTests: 7, runtimeMs: 5 }),
        contender('right', { runtimeMs: 900 }),
      ]),
    ).toEqual(['right', 'wrong']);
  });

  it('still places those who failed, by how far they got', () => {
    expect(
      order([
        contender('two', { passedGate: false, passedTests: 2 }),
        contender('six', { passedGate: false, passedTests: 6 }),
        contender('four', { passedGate: false, passedTests: 4 }),
      ]),
    ).toEqual(['six', 'four', 'two']);
  });

  it('says the gate is what separated them', () => {
    const [, second] = rankContenders([
      contender('right'),
      contender('wrong', { passedGate: false, passedTests: 7 }),
    ]);
    expect(second.decidedBy).toBe('gate');
  });
});

describe('the ladder', () => {
  it('ranks a clear speed difference by speed', () => {
    expect(order([contender('slow', { runtimeMs: 400 }), contender('fast', { runtimeMs: 100 })])).toEqual([
      'fast',
      'slow',
    ]);
  });

  it('falls through to memory when the timings are level', () => {
    const ranked = rankContenders([
      contender('hungry', { runtimeMs: 105, memoryKb: 9000 }),
      contender('lean', { runtimeMs: 100, memoryKb: 3000 }),
    ]);
    expect(ranked.map((entry) => entry.participantId)).toEqual(['lean', 'hungry']);
    expect(ranked[1].decidedBy).toBe('memory');
  });

  it('falls through to submit time when speed and memory are level', () => {
    const ranked = rankContenders([
      contender('later', { runtimeMs: 104, memoryKb: 4000, submittedAt: at(20) }),
      contender('earlier', { runtimeMs: 100, memoryKb: 4000, submittedAt: at(12) }),
    ]);
    expect(ranked.map((entry) => entry.participantId)).toEqual(['earlier', 'later']);
    expect(ranked[1].decidedBy).toBe('submit time');
  });

  it('does not let a 10% timing gap override being first to finish', () => {
    // The whole reason for the band: 100ms versus 108ms is jitter, not skill
    expect(
      order([
        contender('quick-clock', { runtimeMs: 100, submittedAt: at(25) }),
        contender('quick-finish', { runtimeMs: 108, submittedAt: at(11) }),
      ]),
    ).toEqual(['quick-finish', 'quick-clock']);
  });

  it('orders submissions with no timing by memory and then submit time', () => {
    // This is the whole field when the sandbox cannot measure CPU time, so
    // leaving them in whatever order they arrived would decide battles by
    // database ordering
    const ranked = rankContenders([
      contender('c', { runtimeMs: null, memoryKb: 5000, submittedAt: at(11) }),
      contender('a', { runtimeMs: null, memoryKb: 3000, submittedAt: at(20) }),
      contender('b', { runtimeMs: null, memoryKb: 5000, submittedAt: at(10) }),
    ]);

    expect(ranked.map((entry) => entry.participantId)).toEqual(['a', 'b', 'c']);
    expect(ranked.map((entry) => entry.decidedBy)).toEqual(['tied', 'memory', 'submit time']);
  });

  it('falls straight to submit time when nothing can be measured at all', () => {
    const ranked = rankContenders([
      contender('late', { runtimeMs: null, memoryKb: null, submittedAt: at(30) }),
      contender('early', { runtimeMs: null, memoryKb: null, submittedAt: at(12) }),
    ]);

    expect(ranked.map((entry) => entry.participantId)).toEqual(['early', 'late']);
    expect(ranked[1].decidedBy).toBe('submit time');
  });

  it('puts a submission that never ran last among the passers', () => {
    expect(
      order([
        contender('unmeasured', { runtimeMs: null }),
        contender('measured', { runtimeMs: 900 }),
      ]),
    ).toEqual(['measured', 'unmeasured']);
  });
});

describe('rank numbers', () => {
  it('shares a rank when nothing separates two submissions', () => {
    expect(
      ranks([
        contender('a', { runtimeMs: 100, memoryKb: 4000, submittedAt: at(10) }),
        contender('b', { runtimeMs: 100, memoryKb: 4000, submittedAt: at(10) }),
      ]),
    ).toEqual([1, 1]);
  });

  it('skips the numbers a shared rank used up', () => {
    // Two firsts means the next is third, not second
    expect(
      ranks([
        contender('a', { runtimeMs: 100, memoryKb: 4000, submittedAt: at(10) }),
        contender('b', { runtimeMs: 100, memoryKb: 4000, submittedAt: at(10) }),
        contender('c', { runtimeMs: 900 }),
      ]),
    ).toEqual([1, 1, 3]);
  });

  it('ranks a whole field in order', () => {
    expect(
      ranks([
        contender('a', { runtimeMs: 100 }),
        contender('b', { runtimeMs: 300 }),
        contender('c', { runtimeMs: 600 }),
        contender('d', { passedGate: false, passedTests: 5 }),
      ]),
    ).toEqual([1, 2, 3, 4]);
  });
});

describe('the winner', () => {
  it('is whoever came first', () => {
    const ranked = rankContenders([contender('a', { runtimeMs: 100 }), contender('b', { runtimeMs: 500 })]);
    expect(winnerOf(ranked)?.participantId).toBe('a');
  });

  it('is nobody when every submission failed the gate', () => {
    // A contest where nothing worked has no winner, not a least-bad one
    const ranked = rankContenders([
      contender('a', { passedGate: false, passedTests: 7 }),
      contender('b', { passedGate: false, passedTests: 3 }),
    ]);
    expect(winnerOf(ranked)).toBeNull();
  });

  it('is nobody when first place is shared', () => {
    const ranked = rankContenders([
      contender('a', { runtimeMs: 100, memoryKb: 4000, submittedAt: at(10) }),
      contender('b', { runtimeMs: 100, memoryKb: 4000, submittedAt: at(10) }),
    ]);
    expect(winnerOf(ranked)).toBeNull();
  });

  it('is nobody in an empty battle', () => {
    expect(winnerOf(rankContenders([]))).toBeNull();
  });
});

describe('the order the results arrive in never changes the outcome', () => {
  const field = [
    contender('a', { runtimeMs: 100, memoryKb: 4000, submittedAt: at(14) }),
    contender('b', { runtimeMs: 110, memoryKb: 3000, submittedAt: at(12) }),
    contender('c', { runtimeMs: 125, memoryKb: 5000, submittedAt: at(11) }),
    contender('d', { runtimeMs: 400, memoryKb: 2000, submittedAt: at(10) }),
    contender('e', { passedGate: false, passedTests: 6, submittedAt: at(13) }),
  ];

  it('gives the same ranking whichever way round the field is read', () => {
    const forwards = rankContenders(field);
    const backwards = rankContenders([...field].reverse());
    const shuffled = rankContenders([field[2], field[4], field[0], field[3], field[1]]);

    const shape = (entries: ReturnType<typeof rankContenders>) =>
      entries.map((entry) => [entry.participantId, entry.rank]);

    expect(shape(backwards)).toEqual(shape(forwards));
    expect(shape(shuffled)).toEqual(shape(forwards));
  });
});
