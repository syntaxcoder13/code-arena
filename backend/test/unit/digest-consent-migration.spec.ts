import { readFile } from 'node:fs/promises';
import { resolve } from 'node:path';
import { PGlite } from '@electric-sql/pglite';
import { expect, it } from 'vitest';

it('changes only the default for new preferences, preserving existing email choices', async () => {
  const db = new PGlite();
  try {
    await db.exec('CREATE TABLE user_preferences (id serial PRIMARY KEY, "emailDigest" boolean NOT NULL DEFAULT true); INSERT INTO user_preferences DEFAULT VALUES; INSERT INTO user_preferences ("emailDigest") VALUES (false);');
    const sql = await readFile(resolve(__dirname, '../../prisma/migrations/20261016000100_optional_digest_default/migration.sql'), 'utf8');
    await db.exec(sql);
    await db.exec('INSERT INTO user_preferences DEFAULT VALUES;');
    const result = await db.query<{ emailDigest: boolean }>('SELECT "emailDigest" FROM user_preferences ORDER BY id');
    expect(result.rows.map((row) => row.emailDigest)).toEqual([true, false, false]);
  } finally { await db.close(); }
}, 30_000);
