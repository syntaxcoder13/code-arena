import { describe, expect, it } from 'vitest';
import {
  sanitiseTelemetry,
  TELEMETRY_FIELDS,
  telemetryNotes,
} from '../../src/modules/battles/telemetry';

const full = {
  pastes: 2,
  pastedChars: 300,
  largestPaste: 250,
  keystrokes: 400,
  typedChars: 100,
  bursts: 1,
  focusLosses: 3,
  awayMs: 45_000,
  timeToFirstEditMs: 12_000,
  timeToSubmitMs: 600_000,
};

describe('what may be stored', () => {
  it('keeps the known counters', () => {
    expect(sanitiseTelemetry(full)).toEqual(full);
  });

  it('drops every key it does not know', () => {
    // The column is counters. A client must not be able to put text in it by
    // sending text, or bloat the row by sending a thousand fields.
    const out = sanitiseTelemetry({
      ...full,
      code: 'const secret = 1;',
      clipboard: 'whatever was on it',
      whatever: { nested: true },
    });

    expect(Object.keys(out!).sort()).toEqual([...TELEMETRY_FIELDS].sort());
  });

  it('stores numbers and nulls, and nothing else', () => {
    const out = sanitiseTelemetry({ ...full, pastes: 'lots', bursts: { n: 1 } });

    for (const value of Object.values(out!)) {
      expect(typeof value === 'number' || value === null).toBe(true);
    }
    expect(out!.pastes).toBeNull();
    expect(out!.bursts).toBeNull();
  });

  it('caps a number out of range rather than refusing the submission', () => {
    // A wrong number means the client is broken or lying, and neither is a
    // reason to throw somebody's answer away
    const out = sanitiseTelemetry({ ...full, pastes: 9e15, awayMs: 9e15 });

    expect(out!.pastes).toBe(1_000_000);
    expect(out!.awayMs).toBe(24 * 60 * 60 * 1000);
  });

  it('floors a negative to zero', () => {
    expect(sanitiseTelemetry({ ...full, focusLosses: -5 })!.focusLosses).toBe(0);
  });

  it('rounds, so a fractional count cannot be stored', () => {
    expect(sanitiseTelemetry({ ...full, keystrokes: 12.7 })!.keystrokes).toBe(13);
  });

  it('refuses NaN and Infinity', () => {
    const out = sanitiseTelemetry({ ...full, bursts: NaN, typedChars: Infinity });
    expect(out!.bursts).toBeNull();
    expect(out!.typedChars).toBeNull();
  });

  describe('when there is nothing usable', () => {
    it('is null for an old client that sends nothing', () => {
      // Null rather than a row of zeroes, which would read as "this person
      // did nothing at all"
      expect(sanitiseTelemetry(undefined)).toBeNull();
      expect(sanitiseTelemetry(null)).toBeNull();
      expect(sanitiseTelemetry({})).toBeNull();
    });

    it('is null for something that is not an object', () => {
      expect(sanitiseTelemetry('signals')).toBeNull();
      expect(sanitiseTelemetry(42)).toBeNull();
      expect(sanitiseTelemetry([1, 2, 3])).toBeNull();
    });

    it('is null when every known field is unusable', () => {
      expect(sanitiseTelemetry({ pastes: 'x', bursts: null })).toBeNull();
    });

    it('keeps a payload where even one field is real', () => {
      expect(sanitiseTelemetry({ focusLosses: 2, junk: 'x' })).toMatchObject({ focusLosses: 2 });
    });
  });
});

describe('what a reviewer reads', () => {
  it('says nothing at all when there are no signals', () => {
    expect(telemetryNotes(null)).toEqual([]);
  });

  it('puts pastes in proportion rather than alone', () => {
    // "2 pastes" means nothing; three quarters of the answer arriving that
    // way means something
    const notes = telemetryNotes(sanitiseTelemetry(full));
    expect(notes[0]).toBe('2 pastes, 75% of the characters');
  });

  it('calls out one very large paste', () => {
    expect(telemetryNotes(sanitiseTelemetry(full)).join(' ')).toMatch(/Largest single paste 250/);
  });

  it('stays quiet about a small paste', () => {
    const notes = telemetryNotes(sanitiseTelemetry({ ...full, largestPaste: 30 }));
    expect(notes.join(' ')).not.toMatch(/Largest single paste/);
  });

  it('reports switching away with the time, not just the count', () => {
    expect(telemetryNotes(sanitiseTelemetry(full)).join(' ')).toMatch(/Switched away 3.*45s/);
  });

  it('says when the first edit happened, which is the honest reader of a burst', () => {
    expect(telemetryNotes(sanitiseTelemetry(full)).join(' ')).toMatch(/First edit after 12s/);
  });

  it('mentions nothing that did not happen', () => {
    const quiet = telemetryNotes(
      sanitiseTelemetry({ keystrokes: 300, typedChars: 900, timeToFirstEditMs: 4000 }),
    );
    expect(quiet.join(' ')).not.toMatch(/paste|Switched away|pause/);
    expect(quiet.join(' ')).toMatch(/First edit after 4s/);
  });
});
