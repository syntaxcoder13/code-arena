import '@fastify/cookie';
import { AuthenticatedUser } from '../decorators/current-user.decorator';

declare module 'fastify' {
  interface FastifyRequest {
    /** Set by AuthGuard / OptionalAuthGuard from the verified session JWT. */
    user?: AuthenticatedUser;
  }
}
