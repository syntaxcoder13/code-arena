import { OriginPolicy } from './origin-policy';

/** The slice of Fastify's request/reply the hook uses (keeps it independent of which fastify copy is installed). */
interface HookRequest {
  method: string;
  url: string;
  headers: { origin?: string };
}
interface HookReply {
  code(statusCode: number): { send(payload: unknown): unknown };
}

const SAFE_METHODS = new Set(['GET', 'HEAD', 'OPTIONS']);

/**
 * CSRF defence. The session cookie is `SameSite=None` in production (the
 * frontend and API live on different sites), so the browser attaches it to
 * requests any website triggers — including plain HTML form POSTs, which CORS
 * does not stop. Browsers always send `Origin` on such cross-site requests, so
 * any state-changing request whose Origin is not a trusted frontend is refused
 * before it reaches a route handler.
 *
 * Requests with no Origin header (curl, server-to-server) carry no ambient
 * browser credentials to abuse and are left alone.
 */
export function crossSiteRequestGuard(policy: OriginPolicy) {
  return (request: HookRequest, reply: HookReply, done: () => void) => {
    if (SAFE_METHODS.has(request.method)) return done();

    const origin = request.headers.origin;
    if (origin === undefined || policy.isAllowed(origin)) return done();

    reply.code(403).send({
      success: false,
      statusCode: 403,
      message: 'Cross-site request blocked',
      timestamp: new Date().toISOString(),
      path: request.url,
    });
  };
}
