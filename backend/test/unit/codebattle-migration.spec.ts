import { readFileSync, readdirSync } from 'node:fs';
import { resolve } from 'node:path';
import { PGlite } from '@electric-sql/pglite';
import { describe, expect, it } from 'vitest';

const migration = (name: string) => readFileSync(resolve('prisma/migrations', name, 'migration.sql'), 'utf8');
const integrated = () => migration('20261015000200_codebattle_integration');

describe('CodeBattle integration migration', () => {
  for (const legacy of [false, true]) {
    it(`preserves data with ${legacy ? 'historical Battle tables' : 'only the core schema'}`, async () => {
      const db = new PGlite();
      try {
        await db.exec(migration('20261014000000_baseline'));
        await db.exec(migration('20261015000100_hardening'));
        await db.exec(`INSERT INTO users (id, "githubId", username, "updatedAt") VALUES ('u1', '1', 'player', NOW());`);
        if (legacy) {
          for (const file of readdirSync('prisma/sql').filter(name => /^00[2-9]|^010/.test(name)).sort()) {
            await db.exec(readFileSync(resolve('prisma/sql', file), 'utf8'));
          }
          await db.exec(`CREATE TABLE "_applied_sql_migrations" (name TEXT PRIMARY KEY, applied_at TIMESTAMPTZ NOT NULL DEFAULT NOW());
            INSERT INTO "_applied_sql_migrations" (name) VALUES ('002_add_code_battle.sql');
            INSERT INTO battles (id, "creatorId", difficulty, language, visibility, capacity, "durationSeconds", "lobbyExpiresAt", "updatedAt")
              VALUES ('existing', 'u1', 'easy', 'python', 'PUBLIC', 2, 600, NOW(), NOW());
            INSERT INTO battle_participants (id, "battleId", "userId", "updatedAt") VALUES ('p1', 'existing', 'u1', NOW());
            INSERT INTO submissions (id, "participantId", code, language, "updatedAt") VALUES ('s1', 'p1', 'print(42)', 'python', NOW());`);
        }
        await db.exec(integrated());
        await db.exec(integrated());
        expect((await db.query('SELECT username FROM users')).rows).toEqual([{ username: 'player' }]);
        const tables = (await db.query<{ tablename: string }>('SELECT tablename FROM pg_tables WHERE schemaname = current_schema()')).rows.map(row => row.tablename);
        for (const table of ['battles', 'problems', 'submissions', 'judgements', 'reports', 'battle_queue_entries', 'digest_dispatches', '_applied_sql_migrations']) expect(tables).toContain(table);
        if (legacy) {
          expect((await db.query('SELECT id FROM battles')).rows).toEqual([{ id: 'existing' }]);
          expect((await db.query('SELECT code FROM submissions')).rows).toEqual([{ code: 'print(42)' }]);
          expect((await db.query('SELECT name FROM "_applied_sql_migrations"')).rows).toEqual([{ name: '002_add_code_battle.sql' }]);
        }
      } finally { await db.close(); }
    }, 30000);
  }
});
