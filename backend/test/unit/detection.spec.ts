import { beforeEach, describe, expect, it } from 'vitest';
import { DetectionService } from '../../src/modules/battles/detection.service';
import { asPrisma, createPrismaMock, PrismaMock } from '../helpers/mocks';

/** Long enough to be measurable. */
const SOLUTION = `const input = require('fs').readFileSync(0, 'utf8');
function solve(text) {
  const parts = text.trim().split(/\\s+/).filter(Boolean);
  let total = 0;
  for (const part of parts) {
    const value = Number(part);
    if (!Number.isNaN(value)) { total = total + value; }
  }
  return total;
}
process.stdout.write(String(solve(input)));`;

/** The same thing with every name changed - what a copy actually looks like. */
const RENAMED = SOLUTION.replace(/total/g, 'acc')
  .replace(/parts/g, 'chunks')
  .replace(/part/g, 'chunk')
  .replace(/value/g, 'n')
  .replace(/solve/g, 'answer');

/** A different approach to the same problem. */
const DIFFERENT = `const fs = require('fs');
const line = fs.readFileSync(0, 'utf8');
const total = line.split(/\\s+/).map((p) => parseFloat(p)).filter((v) => Number.isFinite(v))
  .reduce((running, v) => running + v, 0);
console.log(total.toString());
if (total < 0) { console.error('negative'); }
process.exitCode = 0;`;

const participant = (id: string, code: string) => ({
  id,
  userId: `u-${id}`,
  submission: { code },
});

describe('DetectionService', () => {
  let prisma: PrismaMock;
  const service = () => new DetectionService(asPrisma(prisma));

  beforeEach(() => {
    prisma = createPrismaMock();
    prisma.battleFlag.upsert.mockResolvedValue({ id: 'f-1' });
  });

  describe('what it looks at', () => {
    it('only submissions that were handed in', async () => {
      prisma.battleParticipant.findMany.mockResolvedValue([]);
      await service().scanBattle('b-1');

      const where = prisma.battleParticipant.findMany.mock.calls[0][0].where;
      expect(where.state).toBe('SUBMITTED');
      expect(where.submission).toEqual({ submittedAt: { not: null } });
    });

    it('never a ghost, whose whole point is being somebody else’s code', async () => {
      prisma.battleParticipant.findMany.mockResolvedValue([]);
      await service().scanBattle('b-1');

      expect(prisma.battleParticipant.findMany.mock.calls[0][0].where.isGhost).toBe(false);
    });

    it('does nothing at all with fewer than two', async () => {
      prisma.battleParticipant.findMany.mockResolvedValue([participant('a', SOLUTION)]);

      expect(await service().scanBattle('b-1')).toEqual({ compared: 0, flagged: 0 });
      expect(prisma.battleFlag.upsert).not.toHaveBeenCalled();
    });
  });

  describe('what it flags', () => {
    it('a renamed copy', async () => {
      prisma.battleParticipant.findMany.mockResolvedValue([
        participant('a', SOLUTION),
        participant('b', RENAMED),
      ]);

      expect(await service().scanBattle('b-1')).toEqual({ compared: 1, flagged: 1 });
      expect(prisma.battleFlag.upsert.mock.calls[0][0].create.score).toBe(1);
    });

    it('leaves two genuinely different answers alone', async () => {
      // The cost of getting this wrong is accusing somebody who did the work
      prisma.battleParticipant.findMany.mockResolvedValue([
        participant('a', SOLUTION),
        participant('b', DIFFERENT),
      ]);

      expect(await service().scanBattle('b-1')).toEqual({ compared: 1, flagged: 0 });
      expect(prisma.battleFlag.upsert).not.toHaveBeenCalled();
    });

    it('compares every pair in a bigger field', async () => {
      prisma.battleParticipant.findMany.mockResolvedValue([
        participant('a', SOLUTION),
        participant('b', DIFFERENT),
        participant('c', RENAMED),
      ]);

      const result = await service().scanBattle('b-1');
      expect(result.compared).toBe(3);
      // a~c only; b matches neither
      expect(result.flagged).toBe(1);
    });

    it('skips a pair where one side has no code at all', async () => {
      prisma.battleParticipant.findMany.mockResolvedValue([
        participant('a', SOLUTION),
        participant('b', ''),
      ]);

      expect(await service().scanBattle('b-1')).toEqual({ compared: 0, flagged: 0 });
    });
  });

  describe('the flag it writes', () => {
    beforeEach(() => {
      prisma.battleParticipant.findMany.mockResolvedValue([
        participant('zzz', SOLUTION),
        participant('aaa', RENAMED),
      ]);
    });

    it('names the pair in a stable order, whichever way round they came', async () => {
      // Otherwise a re-scan writes the same pair twice
      await service().scanBattle('b-1');

      const where = prisma.battleFlag.upsert.mock.calls[0][0].where.participantAId_participantBId;
      expect(where).toEqual({ participantAId: 'aaa', participantBId: 'zzz' });
    });

    it('records what was measured, not only that it fired', async () => {
      await service().scanBattle('b-1');

      const created = prisma.battleFlag.upsert.mock.calls[0][0].create;
      expect(created.score).toBeGreaterThan(0.9);
      expect(created.detail).toMatch(/identical/i);
      expect(created.battleId).toBe('b-1');
      expect(created.state).toBeUndefined();
    });

    it('refreshes the measurement on a re-scan without reopening a decision', async () => {
      await service().scanBattle('b-1');

      const update = prisma.battleFlag.upsert.mock.calls[0][0].update;
      expect(Object.keys(update).sort()).toEqual(['detail', 'score']);
      expect(update.state).toBeUndefined();
    });
  });
});
