import { describe, expect, it, vi } from 'vitest';
import { bracketPairs } from '../../src/modules/arena/bracket';
import { ArenaFeaturesService } from '../../src/modules/arena/features.service';

describe('tournament bracket invariants', () => {
  for (let entrants = 2; entrants <= 16; entrants++) {
    it(`keeps all ${entrants} entrants once, without an empty match`, () => {
      const players = Array.from({ length: entrants }, (_, i) => `player-${i}`);
      const matches = bracketPairs(players);
      const field = matches.flatMap(m => m.b ? [m.a, m.b] : [m.a]);
      expect(field.sort()).toEqual(players.sort());
      expect(matches.every(m => m.a && m.a !== m.b)).toBe(true);
      expect(matches.length).toBe(2 ** Math.ceil(Math.log2(entrants)) / 2);
      expect(matches.filter(m => !m.b).length).toBe(2 ** Math.ceil(Math.log2(entrants)) - entrants);
    });
  }
  it('refuses duplicate players and invalid bracket sizes', () => {
    expect(() => bracketPairs(['a', 'a'])).toThrow();
    expect(() => bracketPairs(['a'])).toThrow();
    expect(() => bracketPairs(Array.from({ length: 17 }, (_, i) => `${i}`))).toThrow();
  });
});

describe('inventory authorization', () => {
  it('refuses locked equipment before any database write', async () => {
    const db = { $transaction: vi.fn() };
    const arena = { summary: vi.fn().mockResolvedValue({ profile: { totalXp: 0, wins: 0 } }), settings: vi.fn().mockResolvedValue({}) };
    const service = new ArenaFeaturesService(db as never, arena as never, {} as never);
    await expect(service.equip('user', 'banner-matrix')).rejects.toThrow('Earn the required XP');
    expect(db.$transaction).not.toHaveBeenCalled();
  });
  it('unlocks items from server XP and victory counts', async () => {
    const arena = { summary: vi.fn().mockResolvedValue({ profile: { totalXp: 750, wins: 1 } }), settings: vi.fn().mockResolvedValue({ equipped: { editor: 'editor-light' } }) };
    const service = new ArenaFeaturesService({} as never, arena as never, {} as never);
    const inventory = await service.inventory('user');
    expect(inventory.items.find(i => i.id === 'banner-matrix')?.unlocked).toBe(true);
    expect(inventory.items.find(i => i.id === 'banner-sunset')?.unlocked).toBe(false);
    expect(inventory.items.find(i => i.id === 'title-duelist')?.unlocked).toBe(true);
    expect(inventory.items.find(i => i.id === 'title-gladiator')?.unlocked).toBe(false);
    expect(inventory.items.find(i => i.id === 'editor-light')?.equipped).toBe(true);
  });
});

describe('tournament progression locking', () => {
  it('takes a database lock and leaves an unfinished match in the same round', async () => {
    const tx = { $queryRaw: vi.fn(), arenaTournament: { findUnique: vi.fn().mockResolvedValue({ state: 'RUNNING', matches: [{ round: 1, winnerId: null, battle: { state: 'JUDGING' } }] }), update: vi.fn() }, arenaTournamentMatch: { create: vi.fn(), update: vi.fn() } };
    const db = { $transaction: vi.fn(async (run: (arg: unknown) => unknown) => run(tx)) };
    const service = new ArenaFeaturesService(db as never, {} as never, {} as never);
    await service.advanceTournament('tournament');
    expect(tx.$queryRaw).toHaveBeenCalledOnce();
    expect(tx.arenaTournamentMatch.create).not.toHaveBeenCalled();
    expect(tx.arenaTournament.update).not.toHaveBeenCalled();
  });
  it('does not recreate a completed tournament bracket', async () => {
    const tx = { $queryRaw: vi.fn(), arenaTournament: { findUnique: vi.fn().mockResolvedValue({ state: 'COMPLETE', matches: [] }) }, arenaTournamentMatch: { create: vi.fn() } };
    const db = { $transaction: vi.fn(async (run: (arg: unknown) => unknown) => run(tx)) };
    const service = new ArenaFeaturesService(db as never, {} as never, {} as never);
    await service.advanceTournament('tournament');
    expect(tx.arenaTournamentMatch.create).not.toHaveBeenCalled();
  });
});
