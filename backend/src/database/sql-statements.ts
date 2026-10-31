/**
 * Splits a migration file into statements.
 *
 * This was `sql.split(';')`, which is right until a semicolon appears
 * somewhere that is not the end of a statement. A sentence in a `--` comment
 * is the way it actually broke: half the comment became the tail of one
 * statement and the rest became the head of the next, and Postgres reported
 * a syntax error pointing at an English word.
 *
 * The same hole swallows a semicolon inside a string literal, inside a
 * quoted identifier, and - the one that would hurt most - inside a
 * dollar-quoted function body, where semicolons are the normal case rather
 * than the exception.
 *
 * So this walks the text instead of splitting it, and only breaks on a
 * semicolon it is actually looking at.
 */
export function statementsIn(sql: string): string[] {
  const statements: string[] = [];
  let start = 0;
  let i = 0;

  const push = (end: number) => {
    const chunk = sql.slice(start, end);
    if (hasCode(chunk)) statements.push(chunk.trim());
    start = end + 1;
  };

  while (i < sql.length) {
    const char = sql[i];
    const next = sql[i + 1];

    // -- to end of line
    if (char === '-' && next === '-') {
      const newline = sql.indexOf('\n', i);
      i = newline === -1 ? sql.length : newline + 1;
      continue;
    }

    // /* ... */, which Postgres allows to nest
    if (char === '/' && next === '*') {
      let depth = 1;
      i += 2;
      while (i < sql.length && depth > 0) {
        if (sql[i] === '/' && sql[i + 1] === '*') {
          depth++;
          i += 2;
        } else if (sql[i] === '*' && sql[i + 1] === '/') {
          depth--;
          i += 2;
        } else {
          i++;
        }
      }
      continue;
    }

    // 'literal', where '' is an escaped quote rather than an empty string
    // followed by another literal
    if (char === "'" || char === '"') {
      const quote = char;
      i++;
      while (i < sql.length) {
        if (sql[i] === quote && sql[i + 1] === quote) {
          i += 2;
          continue;
        }
        if (sql[i] === quote) {
          i++;
          break;
        }
        i++;
      }
      continue;
    }

    // $$ ... $$ or $tag$ ... $tag$ - a function body, where semicolons are
    // the normal case and splitting on them produces nonsense
    if (char === '$') {
      const tag = dollarTagAt(sql, i);
      if (tag) {
        const close = sql.indexOf(tag, i + tag.length);
        i = close === -1 ? sql.length : close + tag.length;
        continue;
      }
    }

    if (char === ';') {
      push(i);
      i++;
      continue;
    }

    i++;
  }

  // Trailing text with no final semicolon is still a statement.
  push(sql.length);

  return statements;
}

/** The opening `$tag$` at this position, or null if the `$` is something else. */
function dollarTagAt(sql: string, at: number): string | null {
  let i = at + 1;
  while (i < sql.length && /[A-Za-z0-9_]/.test(sql[i])) i++;
  if (sql[i] !== '$') return null;
  return sql.slice(at, i + 1);
}

/**
 * Whether a chunk is anything other than comments and whitespace.
 *
 * A file's leading comment block, and the blank tail after its last
 * semicolon, are both chunks that must not be sent to the database.
 */
function hasCode(chunk: string): boolean {
  let stripped = '';
  let i = 0;

  while (i < chunk.length) {
    if (chunk[i] === '-' && chunk[i + 1] === '-') {
      const newline = chunk.indexOf('\n', i);
      i = newline === -1 ? chunk.length : newline + 1;
      continue;
    }
    if (chunk[i] === '/' && chunk[i + 1] === '*') {
      let depth = 1;
      i += 2;
      while (i < chunk.length && depth > 0) {
        if (chunk[i] === '/' && chunk[i + 1] === '*') {
          depth++;
          i += 2;
        } else if (chunk[i] === '*' && chunk[i + 1] === '/') {
          depth--;
          i += 2;
        } else {
          i++;
        }
      }
      continue;
    }
    stripped += chunk[i];
    i++;
  }

  return stripped.trim() !== '';
}
