import { Prisma } from '@prisma/client';
import { PrismaService } from '../../database/prisma.service';

type UserStore = Pick<PrismaService, 'user'>;

/**
 * Usernames mirror the GitHub login and are unique. A GitHub account can be
 * renamed, and a freed login can be taken by someone else, so the same
 * username can legitimately move between accounts. Without handling that, the
 * unique constraint would permanently block the new owner from signing in.
 */

export function isUsernameConflict(err: unknown): boolean {
  if (!(err instanceof Prisma.PrismaClientKnownRequestError) || err.code !== 'P2002') return false;
  const target = err.meta?.target;
  return Array.isArray(target) ? target.includes('username') : target === 'username';
}

/** A unique, obviously-stale placeholder for an account that lost its login. */
export function stalePlaceholder(username: string, githubId: string): string {
  return `${username}~${githubId}`.slice(0, 100);
}

/**
 * Hands `username` over to the GitHub account that owns it now, renaming a
 * different account that still holds it. The displaced account keeps working
 * and gets its real login back the next time its owner signs in.
 */
export async function releaseUsername(prisma: UserStore, username: string, newOwnerGithubId: string): Promise<void> {
  const holder = await prisma.user.findUnique({ where: { username } });
  if (!holder || holder.githubId === newOwnerGithubId) return;

  await prisma.user.update({
    where: { id: holder.id },
    data: { username: stalePlaceholder(holder.username, holder.githubId) },
  });
}

/** Runs a user upsert, retrying once after freeing a username held elsewhere. */
export async function withUsernameConflictRetry<T>(
  prisma: UserStore,
  username: string,
  githubId: string,
  run: () => Promise<T>,
): Promise<T> {
  try {
    return await run();
  } catch (err) {
    if (!isUsernameConflict(err)) throw err;
    await releaseUsername(prisma, username, githubId);
    return run();
  }
}
