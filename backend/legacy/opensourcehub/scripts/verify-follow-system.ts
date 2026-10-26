import 'dotenv/config';
import { PrismaClient } from '@prisma/client';

// A rollback-only check: never destroy real users' follow relationships.
async function verify() {
  const prisma = new PrismaClient();
  const rollback = new Error('Verification complete: roll back test changes');
  try {
    await prisma.$transaction(async tx => {
      const users = await tx.user.findMany({ take: 2, select: { id: true } });
      if (users.length < 2) throw new Error('Need at least two users');
      const pair = { followerId: users[0].id, followingId: users[1].id };
      const where = { followerId_followingId: pair };
      await tx.follow.upsert({ where, update: {}, create: pair });
      await tx.follow.upsert({ where, update: {}, create: pair });
      if (await tx.follow.count({ where: pair }) !== 1) throw new Error('Follow is not idempotent');
      await tx.follow.deleteMany({ where: pair });
      await tx.follow.deleteMany({ where: pair });
      if (await tx.follow.count({ where: pair }) !== 0) throw new Error('Unfollow failed');
      throw rollback;
    });
  } catch (err) {
    if (err !== rollback) throw err;
    console.log('Follow/unfollow verified; all test changes rolled back.');
  } finally { await prisma.$disconnect(); }
}
verify().catch(err => { console.error(err); process.exitCode = 1; });
