import { metrics } from './common/observability/metrics';
import { ValidationPipe } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { FastifyAdapter,NestFastifyApplication } from '@nestjs/platform-fastify';
import fastifyCors from '@fastify/cors';
import fastifyHelmet from '@fastify/helmet';
import fastifyCookie from '@fastify/cookie';
import { AllExceptionsFilter } from './common/filters/http-exception.filter';
import { OriginPolicyService } from './common/security/origin-policy';
import { crossSiteRequestGuard } from './common/security/cross-site-guard';

/**
 * `app.register` is typed against the fastify copy bundled with
 * @nestjs/platform-fastify, while the @fastify/* plugins are typed against the
 * top-level one; the two are structurally identical at runtime.
 */
type RegisterPlugin = (plugin: unknown, options?: Record<string, unknown>) => Promise<unknown>;

/**
 * Collapses leading duplicate slashes (e.g. "//api/..." from a client whose
 * API base URL ends in "/"). This must happen in `rewriteUrl`, which runs
 * before routing; an `onRequest` hook runs after the route is already chosen.
 */
export function normalizeRequestUrl(url: string | undefined): string {
  return url && url.startsWith('//') ? url.replace(/^\/+/, '/') : url || '/';
}

export function createFastifyAdapter(): FastifyAdapter {
  const trustedProxies = (process.env.TRUSTED_PROXY_CIDRS ?? '').split(',').map((value) => value.trim()).filter(Boolean);
  return new FastifyAdapter({
    logger: false,
    // Explicit addresses only: trusting every forwarded header lets callers
    // spoof their IP and bypass the rate limiter. Docker peers vary by host.
    trustProxy: trustedProxies.length ? trustedProxies : false,
    rewriteUrl: (req: { url?: string }) => normalizeRequestUrl(req.url),
  });
}

/** Plugins, pipes and filters shared by the server and the e2e tests. */
export async function configureApp(app: NestFastifyApplication): Promise<void> {
  const configService = app.get(ConfigService);
  const originPolicy = app.get(OriginPolicyService);
  const register = app.register.bind(app) as unknown as RegisterPlugin;

  const timings = new WeakMap<object, number>();
  const fastify = app.getHttpAdapter().getInstance();
  fastify.addHook('onRequest', async (request: object) => { timings.set(request, performance.now()); });
  fastify.addHook('onResponse', async (request: { routeOptions?: { url?: string }; method: string }, reply: { statusCode: number }) => {
    metrics.observe(request.routeOptions?.url === '/api/events' ? 'stream:duration' : `http:${request.method}:${request.routeOptions?.url ?? 'unmatched'}:${reply.statusCode}`, performance.now() - (timings.get(request) ?? performance.now()), reply.statusCode >= 500);
  });

  // 1. Security headers
  await register(fastifyHelmet, {
    contentSecurityPolicy: false,
    crossOriginEmbedderPolicy: false,
  });

  // 2. Cookie parser
  await register(fastifyCookie, {
    secret: configService.get<string>('security.cookieSecret'),
  });

  // 3. CORS with credentials — only trusted frontend origins may read responses.
  // Requests without an Origin (curl, server-to-server) get no CORS headers at all.
  await register(fastifyCors, {
    origin: (origin: string | undefined, cb: (err: Error | null, allow: boolean) => void) => {
      cb(null, originPolicy.isAllowed(origin));
    },
    credentials: true,
    methods: ['GET', 'POST', 'PUT', 'PATCH', 'DELETE', 'OPTIONS'],
    allowedHeaders: ['Content-Type', 'Authorization', 'Accept', 'Origin', 'X-Requested-With'],
  });

  // 4. CSRF: refuse state-changing requests from untrusted origins
  app.getHttpAdapter().getInstance().addHook('onRequest', crossSiteRequestGuard(originPolicy));

  // 5. Validation and type coercion
  app.useGlobalPipes(
    new ValidationPipe({
      whitelist: true,
      transform: true,
      transformOptions: { enableImplicitConversion: true },
    }),
  );

  // 6. Standardised error responses
  app.useGlobalFilters(new AllExceptionsFilter());

  // 7. Graceful shutdown
  app.enableShutdownHooks();
}
