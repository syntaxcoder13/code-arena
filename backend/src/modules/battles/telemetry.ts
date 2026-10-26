/**
 * The signals a submission carries about how it was written.
 *
 * Everything here arrives from the player's own browser, so none of it can be
 * trusted as evidence — somebody determined enough will send whatever numbers
 * they like. That is not what it is for. It is for the ordinary case, where
 * a human reviewing a flagged pair wants to know whether the answer was typed
 * or arrived whole, and it is one more thing a person would have to think to
 * fake.
 *
 * The allowed shape is enforced rather than assumed: only these keys, only
 * finite numbers, all clamped. A client cannot store text in this column by
 * sending text, and cannot bloat the row by sending a thousand fields.
 */

/** Every key that may be stored, and nothing else. */
export const TELEMETRY_FIELDS = [
  'pastes',
  'pastedChars',
  'largestPaste',
  'keystrokes',
  'typedChars',
  'bursts',
  'focusLosses',
  'awayMs',
  'timeToFirstEditMs',
  'timeToSubmitMs',
] as const;

export type TelemetryField = (typeof TELEMETRY_FIELDS)[number];

export type Telemetry = Record<TelemetryField, number | null>;

/**
 * A day in milliseconds, and a generous ceiling on counts.
 *
 * Caps rather than rejections: a number out of range says the client is
 * broken or lying, and neither is a reason to refuse somebody's submission.
 */
const MAX_COUNT = 1_000_000;
const MAX_MS = 24 * 60 * 60 * 1000;

function clamp(value: unknown, max: number): number | null {
  if (typeof value !== 'number' || !Number.isFinite(value)) return null;
  return Math.min(Math.max(Math.round(value), 0), max);
}

/**
 * Narrows whatever the browser sent to the shape above.
 *
 * Returns null when there is nothing usable, so an old client that sends
 * nothing leaves the column null rather than storing a row of zeroes that
 * would read as "this person did nothing at all".
 */
export function sanitiseTelemetry(input: unknown): Telemetry | null {
  if (!input || typeof input !== 'object' || Array.isArray(input)) return null;

  const source = input as Record<string, unknown>;
  const out = {} as Telemetry;
  let anything = false;

  for (const field of TELEMETRY_FIELDS) {
    const max = field.endsWith('Ms') ? MAX_MS : MAX_COUNT;
    const value = clamp(source[field], max);
    out[field] = value;
    if (value !== null) anything = true;
  }

  return anything ? out : null;
}

/** What a reviewer is shown, when there is anything worth saying. */
export function telemetryNotes(telemetry: Telemetry | null): string[] {
  if (!telemetry) return [];

  const notes: string[] = [];
  const pasted = telemetry.pastedChars ?? 0;
  const typed = telemetry.typedChars ?? 0;
  const total = pasted + typed;

  if ((telemetry.pastes ?? 0) > 0 && total > 0) {
    notes.push(
      `${telemetry.pastes} paste${telemetry.pastes === 1 ? '' : 's'}, ` +
        `${Math.round((pasted / total) * 100)}% of the characters`,
    );
  }
  if ((telemetry.largestPaste ?? 0) >= 200) {
    notes.push(`Largest single paste ${telemetry.largestPaste} characters`);
  }
  if ((telemetry.bursts ?? 0) > 0) {
    notes.push(
      `${telemetry.bursts} long pause${telemetry.bursts === 1 ? '' : 's'} followed by a lot at once`,
    );
  }
  if ((telemetry.focusLosses ?? 0) > 0) {
    const seconds = Math.round((telemetry.awayMs ?? 0) / 1000);
    notes.push(`Switched away ${telemetry.focusLosses}×, ${seconds}s in total`);
  }
  if (telemetry.timeToFirstEditMs !== null && telemetry.timeToFirstEditMs !== undefined) {
    notes.push(`First edit after ${Math.round(telemetry.timeToFirstEditMs / 1000)}s`);
  }

  return notes;
}
