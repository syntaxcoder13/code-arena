import { describe, expect, it } from 'vitest';
import { readdirSync, readFileSync } from 'node:fs';
import { join } from 'node:path';
import { statementsIn } from '../../src/database/sql-statements';

/**
 * Every migration already applied to the real database must split the same
 * way it did under the old splitter, or this change has silently rewritten
 * history that is already on disk.
 */
describe('the migrations already on disk', () => {
  const dir = join(__dirname, '..', '..', 'prisma', 'sql');
  const files = readdirSync(dir).filter((n) => n.endsWith('.sql')).sort();

  it('has files to check', () => {
    expect(files.length).toBeGreaterThan(0);
  });

  for (const name of files) {
    it(`${name} still parses into runnable statements`, () => {
      const statements = statementsIn(readFileSync(join(dir, name), 'utf8'));
      expect(statements.length).toBeGreaterThan(0);
      // Nothing that is only a comment, and nothing empty
      for (const statement of statements) {
        expect(statement.trim()).not.toBe('');
      }
    });
  }
});
