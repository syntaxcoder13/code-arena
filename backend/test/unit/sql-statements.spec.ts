import { describe, expect, it } from 'vitest';
import { statementsIn } from '../../src/database/sql-statements';

describe('splitting a migration into statements', () => {
  it('splits on the semicolons that end statements', () => {
    const sql = `CREATE TABLE a (id TEXT);\nCREATE INDEX b ON a(id);`;
    expect(statementsIn(sql)).toHaveLength(2);
  });

  it('keeps a trailing statement that has no final semicolon', () => {
    expect(statementsIn('CREATE TABLE a (id TEXT)')).toEqual(['CREATE TABLE a (id TEXT)']);
  });

  it('drops a comment-only chunk rather than sending it to the database', () => {
    const sql = `-- what this file is for\n-- and why\n\nCREATE TABLE a (id TEXT);\n`;
    expect(statementsIn(sql)).toEqual(['-- what this file is for\n-- and why\n\nCREATE TABLE a (id TEXT)']);
  });

  it('ignores a semicolon inside a line comment', () => {
    // This is the one that actually broke: an English sentence in a header
    // comment became the tail of one statement and the head of the next, and
    // Postgres reported a syntax error pointing at an ordinary word.
    const sql = `-- A pair becomes a battle; an entry nobody matches falls back.\nCREATE TABLE a (id TEXT);`;
    const statements = statementsIn(sql);

    expect(statements).toHaveLength(1);
    expect(statements[0]).toContain('CREATE TABLE a (id TEXT)');
  });

  it('ignores a semicolon inside a block comment', () => {
    const sql = `/* one; two; three */\nCREATE TABLE a (id TEXT);`;
    expect(statementsIn(sql)).toHaveLength(1);
  });

  it('handles nested block comments, which Postgres allows', () => {
    const sql = `/* outer /* inner; */ still a comment; */ CREATE TABLE a (id TEXT);`;
    expect(statementsIn(sql)).toHaveLength(1);
  });

  it('ignores a semicolon inside a string literal', () => {
    const sql = `INSERT INTO a (note) VALUES ('one; two');\nCREATE INDEX b ON a(note);`;
    expect(statementsIn(sql)).toHaveLength(2);
  });

  it('reads a doubled quote as an escape, not as the end of the literal', () => {
    const sql = `INSERT INTO a (note) VALUES ('it''s; fine');`;
    const statements = statementsIn(sql);

    expect(statements).toHaveLength(1);
    expect(statements[0]).toContain("'it''s; fine'");
  });

  it('ignores a semicolon inside a quoted identifier', () => {
    const sql = `ALTER TABLE "odd;name" ADD COLUMN x TEXT;`;
    expect(statementsIn(sql)).toHaveLength(1);
  });

  it('keeps a dollar-quoted function body whole', () => {
    // The one that would hurt most: inside a body, semicolons are the normal
    // case rather than the exception
    const sql = `CREATE FUNCTION f() RETURNS void AS $$
BEGIN
  UPDATE a SET x = 1;
  UPDATE a SET y = 2;
END;
$$ LANGUAGE plpgsql;
CREATE INDEX b ON a(x);`;
    const statements = statementsIn(sql);

    expect(statements).toHaveLength(2);
    expect(statements[0]).toContain('UPDATE a SET y = 2;');
    expect(statements[1]).toContain('CREATE INDEX');
  });

  it('respects a tagged dollar quote', () => {
    const sql = `CREATE FUNCTION f() RETURNS void AS $body$ SELECT 1; SELECT 2; $body$ LANGUAGE sql;`;
    expect(statementsIn(sql)).toHaveLength(1);
  });

  it('does not mistake a positional parameter for a dollar quote', () => {
    const sql = `INSERT INTO a (id) VALUES ($1);\nINSERT INTO a (id) VALUES ($2);`;
    expect(statementsIn(sql)).toHaveLength(2);
  });

  it('leaves no empty statement after a trailing newline', () => {
    const sql = `CREATE TABLE a (id TEXT);\n\n`;
    expect(statementsIn(sql)).toEqual(['CREATE TABLE a (id TEXT)']);
  });
});
