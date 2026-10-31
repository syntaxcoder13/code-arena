import * as crypto from 'node:crypto';

/**
 * PKCE (RFC 7636, S256) helpers. The browser that starts login keeps a random
 * `code_verifier` and sends only its SHA-256 `code_challenge`; the one-time
 * login code is redeemable only together with that verifier, so a code that
 * leaks, or is planted in someone else's browser, is useless.
 */

/** base64url(SHA-256(x)) is always 43 characters. */
const CHALLENGE_PATTERN = /^[A-Za-z0-9_-]{43}$/;
/** RFC 7636 §4.1: 43-128 unreserved characters. */
const VERIFIER_PATTERN = /^[A-Za-z0-9._~-]{43,128}$/;

export function isValidChallenge(value: unknown): value is string {
  return typeof value === 'string' && CHALLENGE_PATTERN.test(value);
}

export function isValidVerifier(value: unknown): value is string {
  return typeof value === 'string' && VERIFIER_PATTERN.test(value);
}

export function challengeFromVerifier(verifier: string): string {
  return crypto.createHash('sha256').update(verifier, 'ascii').digest('base64url');
}

/** Constant-time string comparison (false for different lengths). */
export function safeEqual(a: string, b: string): boolean {
  const left = Buffer.from(a);
  const right = Buffer.from(b);
  return left.length === right.length && crypto.timingSafeEqual(left, right);
}

export function verifierMatchesChallenge(verifier: string, challenge: string): boolean {
  return isValidVerifier(verifier) && isValidChallenge(challenge) && safeEqual(challengeFromVerifier(verifier), challenge);
}

/** 256-bit random, URL-safe token. */
export function randomToken(): string {
  return crypto.randomBytes(32).toString('base64url');
}

export function sha256Hex(value: string): string {
  return crypto.createHash('sha256').update(value).digest('hex');
}
