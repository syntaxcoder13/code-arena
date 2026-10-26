import { CanActivate,ExecutionContext,ForbiddenException,Injectable } from '@nestjs/common';
import { FastifyRequest } from 'fastify';
import { AuthenticatedUser } from '../../common/decorators/current-user.decorator';

/**
 * Who may read the review queue.
 *
 * Deliberately an environment variable rather than a column. A reviewer is
 * appointed by a deploy, which means the list cannot be changed by anything
 * that can write to the database - no row, no compromised session and no bug
 * in an unrelated endpoint can hand somebody the queue. At this size the cost
 * of that choice is a redeploy when the list changes, which is nothing, and
 * it removes the whole question of how privilege is granted.
 */
export function adminUsernames(): Set<string> {
  return new Set(
    (process.env.ADMIN_USERNAMES ?? '')
      .split(',')
      .map((name) => name.trim().toLowerCase())
      .filter(Boolean),
  );
}

export function isAdmin(username: string | undefined): boolean {
  if (!username) return false;
  return adminUsernames().has(username.toLowerCase());
}

/**
 * Rejects anybody who is not a named reviewer.
 *
 * Used alongside `AuthGuard`, never instead of it: this one only asks who the
 * session belongs to, not whether it is valid.
 */
@Injectable()
export class AdminGuard implements CanActivate {
  canActivate(context: ExecutionContext): boolean {
    const request = context.switchToHttp().getRequest<FastifyRequest>();
    const user = request.user as AuthenticatedUser | undefined;

    if (!isAdmin(user?.username)) {
      // Not 403-with-an-explanation: an endpoint that says "you are not an
      // admin" tells an attacker the endpoint is worth attacking.
      throw new ForbiddenException('Not found');
    }
    return true;
  }
}
