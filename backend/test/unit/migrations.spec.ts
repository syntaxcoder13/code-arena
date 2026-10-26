import { readFileSync } from 'node:fs';
import { resolve } from 'node:path';
import { PGlite } from '@electric-sql/pglite';
import { describe, expect, it } from 'vitest';

describe('PostgreSQL hardening migration', () => {
  it('merges legacy identities, preserves notes and isolates different owners/users', async () => {
    const db = new PGlite();
    try {
      const migration = (name: string) => readFileSync(resolve('prisma/migrations', name, 'migration.sql'), 'utf8');
      await db.exec(migration('20261014000000_baseline'));
      await db.exec(`
        INSERT INTO users (id, "githubId", username, "updatedAt") VALUES
          ('u1', '1', 'one', NOW()), ('u2', '2', 'two', NOW());
        INSERT INTO user_preferences (id, "userId", "experienceLevel", "updatedAt")
          VALUES ('p1', 'u1', 'advanced', NOW());
        INSERT INTO saved_issues (id, "userId", "issueId", owner, repo, "issueNumber", notes, "seekingBuddy", "isClaimed", "claimExpiresAt", "updatedAt") VALUES
          ('s1', 'u1', '123', 'Owner', 'my_repo', 7, 'first note', true, false, NULL, NOW() - INTERVAL '1 day'),
          ('s2', 'u1', 'Owner_my_repo_7', 'owner', 'my_repo', 7, 'second note', false, true, NOW() + INTERVAL '1 day', NOW()),
          ('s3', 'u1', 'other/my_repo#7', 'other', 'my_repo', 7, 'other owner', false, false, NULL, NOW()),
          ('s4', 'u2', '123', 'owner', 'my_repo', 7, 'other user', false, false, NULL, NOW());
      `);
      await db.exec(migration('20261015000100_hardening'));
      const { rows } = await db.query<{ issueId: string; notes: string; seekingBuddy: boolean; isClaimed: boolean }>(
        `SELECT * FROM saved_issues WHERE "userId" = 'u1' AND owner = 'owner'`,
      );
      expect(rows).toHaveLength(1);
      expect(rows[0]).toMatchObject({ issueId: 'owner/my_repo#7', seekingBuddy: true, isClaimed: true });
      expect(rows[0].notes).toContain('first note');
      expect(rows[0].notes).toContain('second note');
      expect((await db.query('SELECT * FROM saved_issues')).rows).toHaveLength(3);
      expect((await db.query('SELECT * FROM saved_issue_identity_archive_20261015')).rows).toHaveLength(4);
      expect((await db.query('SELECT "preferredDifficulty" FROM user_preferences')).rows[0]).toEqual({ preferredDifficulty: ['advanced'] });
      await expect(db.exec(`INSERT INTO saved_issues (id, "userId", "issueId", owner, repo, "issueNumber", "updatedAt") VALUES ('bad', 'u1', 'different-id', 'owner', 'my_repo', 7, NOW())`)).rejects.toThrow();
    } finally {
      await db.close();
    }
  }, 30000);
});
