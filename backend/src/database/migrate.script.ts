import '../load-env';
import { PrismaClient } from '@prisma/client';
import { readdirSync, readFileSync } from 'node:fs';
import { join } from 'node:path';
import { statementsIn } from './sql-statements';

/**
 * Historical SQL runner, retained for recovery/reference only.
 * Normal deployments now use npm run migrate (Prisma migrate deploy).
 * Do not replay these files on a database managed by Prisma migrations.
 *
 * Applies the SQL in prisma/sql, and records what it applied.
 *
 * Historical flags are --dry and --baseline. This runner is not invoked
 * by startup or npm run migrate.
 *
 * These files exist because Prisma's own migrate cannot reach this database:
 * DDL does not go through a connection pooler. Until now they were applied by
 * hand with a throwaway script, and nothing anywhere recorded which had been
 * run - so a second deployment had no way to find out except by trying.
 *
 * `--baseline` is for exactly that case: a database where the files were
 * already applied by hand. It writes the ledger without touching the schema.
 */
const LEDGER = '_applied_sql_migrations';
const SQL_DIR = join(__dirname, '..', '..', 'prisma', 'sql');

const prisma = new PrismaClient();

async function main() {
  const dryRun = process.argv.includes('--dry');
  const baseline = process.argv.includes('--baseline');

  await prisma.$executeRawUnsafe(
    `CREATE TABLE IF NOT EXISTS "${LEDGER}" (
       name       TEXT PRIMARY KEY,
       applied_at TIMESTAMPTZ NOT NULL DEFAULT now()
     )`,
  );

  const onDisk = readdirSync(SQL_DIR)
    .filter((name) => name.endsWith('.sql'))
    .sort();
  const applied = new Set(
    (await prisma.$queryRawUnsafe<Array<{ name: string }>>(`SELECT name FROM "${LEDGER}"`)).map(
      (row) => row.name,
    ),
  );
  const pending = onDisk.filter((name) => !applied.has(name));

  console.log(`\n${onDisk.length} migration files, ${applied.size} already applied\n`);

  if (pending.length === 0) {
    console.log('Nothing to do.');
    return;
  }

  if (baseline) {
    for (const name of pending) {
      await prisma.$executeRawUnsafe(`INSERT INTO "${LEDGER}" (name) VALUES ($1)`, name);
      console.log(`  recorded  ${name}  (not run)`);
    }
    console.log(`\n${pending.length} recorded as already applied.`);
    return;
  }

  for (const name of pending) {
    const statements = statementsIn(readFileSync(join(SQL_DIR, name), 'utf8'));
    if (dryRun) {
      console.log(`  would run  ${name}  (${statements.length} statements)`);
      continue;
    }

    // Deliberately not wrapped in one transaction: ALTER TYPE ... ADD VALUE
    // cannot run inside a transaction block, and these files are additive.
    for (const statement of statements) {
      await prisma.$executeRawUnsafe(statement);
    }
    await prisma.$executeRawUnsafe(`INSERT INTO "${LEDGER}" (name) VALUES ($1)`, name);
    console.log(`  applied  ${name}  (${statements.length} statements)`);
  }

  console.log(
    dryRun
      ? `\n${pending.length} would be applied. Run without --dry to apply them.`
      : `\n${pending.length} applied.`,
  );
}

main()
  .catch((error) => {
    console.error('\nMigration failed. Nothing after this point was applied.');
    console.error(error);
    process.exitCode = 1;
  })
  .finally(() => prisma.$disconnect());
