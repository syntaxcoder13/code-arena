import { Logger } from '@nestjs/common';

/**
 * Startup checks for the secrets the app signs, encrypts and authenticates
 * with. In production a missing, weak or well-known-default secret aborts the
 * boot instead of silently protecting data with a value that is public in the
 * repository's history.
 */

/** Values that have been committed to this repository and must never be used. */
export const KNOWN_INSECURE_SECRETS: ReadonlySet<string> = new Set([
  'opensourcehub_jwt_super_secret_key_change_in_prod',
  'opensourcehub_cookie_secret_key_change_in_prod',
  'opensourcehub_default_aes_key_32_bytes!',
  'opensourcehub_development_session_secret_replace_in_prod',
  'opensourcehub_dev_secret_key_change_in_production_2025',
]);

export const MIN_SECRET_LENGTH = 32;

export interface SecurityConfigReport {
  errors: string[];
  warnings: string[];
}

interface SecretRule {
  /** Env var names, in priority order (later ones are fallbacks). */
  names: string[];
  label: string;
}

const SECRET_RULES: SecretRule[] = [
  { names: ['JWT_SECRET', 'SESSION_SECRET'], label: 'JWT_SECRET' },
  { names: ['COOKIE_SECRET', 'SESSION_SECRET'], label: 'COOKIE_SECRET' },
  { names: ['ENCRYPTION_KEY'], label: 'ENCRYPTION_KEY' },
];

const REQUIRED_SETTINGS = ['DATABASE_URL', 'GITHUB_CLIENT_ID', 'GITHUB_CLIENT_SECRET', 'FRONTEND_URL'];

function firstSet(env: NodeJS.ProcessEnv, names: string[]): { name: string; value: string } | null {
  for (const name of names) {
    const value = env[name];
    if (value && value.trim()) return { name, value: value.trim() };
  }
  return null;
}

/** Collects configuration problems; callers decide whether they are fatal. */
export function checkSecurityConfig(env: NodeJS.ProcessEnv): SecurityConfigReport {
  const problems: string[] = [];

  for (const rule of SECRET_RULES) {
    const found = firstSet(env, rule.names);
    if (!found) {
      problems.push(`${rule.label} is not set (generate one with: node -e "console.log(require('crypto').randomBytes(32).toString('hex'))")`);
      continue;
    }
    if (KNOWN_INSECURE_SECRETS.has(found.value)) {
      problems.push(`${found.name} is a default value published in this repository; generate a new secret`);
    } else if (found.value.length < MIN_SECRET_LENGTH) {
      problems.push(`${found.name} is shorter than ${MIN_SECRET_LENGTH} characters`);
    }
  }

  for (const name of REQUIRED_SETTINGS) {
    if (!env[name]?.trim()) problems.push(`${name} is not set`);
  }

  const frontendUrl = env.FRONTEND_URL?.trim();
  if (frontendUrl && /^https?:\/\/(localhost|127\.0\.0\.1|\[::1\])(:|\/|$)/.test(frontendUrl)) {
    problems.push('FRONTEND_URL points at localhost; set it to the deployed frontend origin');
  }

  const isProduction = env.NODE_ENV === 'production';
  return isProduction ? { errors: problems, warnings: [] } : { errors: [], warnings: problems };
}

/**
 * Logs warnings outside production; throws in production so a misconfigured
 * deployment fails fast and visibly instead of running unprotected.
 */
export function assertSecurityConfig(env: NodeJS.ProcessEnv = process.env): void {
  const { errors, warnings } = checkSecurityConfig(env);
  const logger = new Logger('SecurityConfig');

  for (const warning of warnings) {
    logger.warn(`${warning} — this would stop the server from starting in production`);
  }

  if (errors.length > 0) {
    throw new Error(`Refusing to start with an insecure configuration:\n  - ${errors.join('\n  - ')}`);
  }
}
