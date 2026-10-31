import { Injectable, OnModuleInit, OnModuleDestroy, Logger } from '@nestjs/common';
import { Prisma, PrismaClient } from '@prisma/client';
import { metrics } from '../common/observability/metrics';
import { errorMessage } from '../common/utils/errors.util';

/** Prisma errors are multi-line; the first line is the useful summary. */
const firstLine = (text: string) => text.split("\n")[0].trim();

/** Short, log-friendly form of a database error. */
export function firstLineOfDbError(err: unknown): string {
  return firstLine(errorMessage(err));
}

@Injectable()
export class PrismaService extends PrismaClient<Prisma.PrismaClientOptions, 'query'> implements OnModuleInit, OnModuleDestroy {
  private readonly logger = new Logger(PrismaService.name);

  constructor() {
    super({
      datasourceUrl: normalizeDatabaseUrl(process.env.DATABASE_URL) || undefined,
      log: [{ emit: 'event', level: 'query' }, 'warn', 'error'],
    });
    this.$on('query', event => { if (process.env.PERF_QUERY_TIMINGS === 'true') metrics.observe('db:query', event.duration); });
  }

  /**
   * Retries the first connection with backoff: a brief network blip (or a
   * database still waking up) should not crash the whole process on boot.
   */
  async onModuleInit() {
    const delaysMs = [1000, 2000, 4000, 8000];

    for (let attempt = 0; ; attempt++) {
      try {
        await this.$connect();
        this.logger.log('Prisma connected to PostgreSQL successfully');
        return;
      } catch (err) {
        if (attempt >= delaysMs.length) {
          this.logger.error(`Prisma could not connect to PostgreSQL: ${errorMessage(err)}`);
          throw err;
        }
        const wait = delaysMs[attempt];
        this.logger.warn(
          `PostgreSQL unreachable (${firstLine(errorMessage(err))}); retrying in ${wait / 1000}s`,
        );
        await new Promise((resolve) => setTimeout(resolve, wait));
      }
    }
  }

  async onModuleDestroy() {
    await this.$disconnect();
    this.logger.log('Prisma disconnected from PostgreSQL');
  }
}

/** Adds a parameter only when the deployment has not set it itself. */
function withDefault(url: string, key: string, value: string): string {
  if (new RegExp(`[?&]${key}=`).test(url)) return url;
  return `${url}${url.includes('?') ? '&' : '?'}${key}=${value}`;
}

/**
 * Fills in the connection settings this app needs.
 *
 * `socket_timeout` matters most: without it a query stuck on a flaky network
 * holds its connection forever, and a handful of those exhaust the pool
 * permanently — every later request then fails after `pool_timeout`, even a
 * single-row lookup. With it, the query fails and the connection is reused.
 */
export function normalizeDatabaseUrl(rawUrl: string | undefined): string {
  let url = rawUrl ?? '';
  if (!url) return url;

  // Supabase's transaction pooler (port 6543) cannot keep prepared
  // statements, so Prisma has to be told - and pays for it: in that mode it
  // wraps every query as BEGIN, DEALLOCATE ALL, query, COMMIT. Measured
  // against this database that is four round trips for a SELECT 1, 815ms
  // against 164ms for the same query on the session pooler (port 5432).
  //
  // Transaction mode exists for serverless functions that open a connection
  // per request. This is one long-running process holding a small pool, which
  // is exactly what session mode is for - so a 5432 pooler URL is left alone
  // rather than matched on the hostname and given the slow flag by mistake.
  if (isTransactionPooler(url)) {
    url = withDefault(url, 'pgbouncer', 'true');
  }
  if (url.includes('pooler.supabase.com')) {
    url = withDefault(url, 'connection_limit', '10');
  }

  url = withDefault(url, 'connect_timeout', '10');
  url = withDefault(url, 'pool_timeout', '10');
  // Healthy queries take well under a second; a longer wait means the socket is dead
  url = withDefault(url, 'socket_timeout', '5');
  return url;
}

/** Supabase's transaction-mode pooler, which cannot hold prepared statements. */
export function isTransactionPooler(url: string): boolean {
  return /:6543(\/|\?|$)/.test(url);
}

/**
 * Pooled connections can go stale (an idle socket dropped by the network or
 * the pooler). The first query on such a connection fails on timeout; the
 * next one gets a fresh connection, so a single retry usually succeeds.
 */
export function isTransientDbError(err: unknown): boolean {
  const message = errorMessage(err);
  return (
    message.includes('Socket timeout') ||
    message.includes('Timed out fetching a new connection') ||
    message.includes("Can't reach database server") ||
    message.includes('Connection closed')
  );
}

export async function withDbRetry<T>(run: () => Promise<T>, onRetry?: (err: unknown) => void): Promise<T> {
  try {
    return await run();
  } catch (err) {
    if (!isTransientDbError(err)) throw err;
    onRetry?.(err);
    return run();
  }
}
