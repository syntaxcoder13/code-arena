import 'dotenv/config';
import { MongoClient } from 'mongodb';
import { PrismaClient } from '@prisma/client';

async function migrate() {
  console.log('--- STARTING MIGRATION: MONGODB -> POSTGRESQL ---');
  const mongoUri = process.env.MONGODB_URI;
  if (!mongoUri) {
    throw new Error('MONGODB_URI is not defined in .env');
  }

  const mongo = new MongoClient(mongoUri);
  await mongo.connect();
  console.log('✓ Connected to MongoDB Atlas');

  const prisma = new PrismaClient();
  await prisma.$connect();
  console.log('✓ Connected to PostgreSQL via Prisma');

  const db = mongo.db();

  // 1. Migrate Users
  const usersColl = db.collection('users');
  const mongoUsers = await usersColl.find({}).toArray();
  console.log(`Found ${mongoUsers.length} users in MongoDB.`);

  const idMap = new Map<string, string>(); // mongo _id -> postgres id

  for (const u of mongoUsers) {
    const mongoId = u._id.toString();
    const createdUser = await prisma.user.upsert({
      where: { githubId: String(u.githubId) },
      update: {
        username: u.username || 'user',
        name: u.name || '',
        avatarUrl: u.avatarUrl || '',
        bio: u.bio || '',
        company: u.company || '',
        location: u.location || '',
        blog: u.blog || '',
        twitterUsername: u.twitterUsername || '',
        publicRepos: u.publicRepos || 0,
        totalPrivateRepos: u.totalPrivateRepos || 0,
        ownedPrivateRepos: u.ownedPrivateRepos || 0,
        githubFollowers: u.followers || 0,
        githubFollowing: u.following || 0,
        email: u.email || '',
        accessToken: u.accessToken || '',
        technologies: u.technologies || [],
      },
      create: {
        githubId: String(u.githubId),
        username: u.username || 'user',
        name: u.name || '',
        avatarUrl: u.avatarUrl || '',
        bio: u.bio || '',
        company: u.company || '',
        location: u.location || '',
        blog: u.blog || '',
        twitterUsername: u.twitterUsername || '',
        publicRepos: u.publicRepos || 0,
        totalPrivateRepos: u.totalPrivateRepos || 0,
        ownedPrivateRepos: u.ownedPrivateRepos || 0,
        githubFollowers: u.followers || 0,
        githubFollowing: u.following || 0,
        email: u.email || '',
        accessToken: u.accessToken || '',
        technologies: u.technologies || [],
      },
    });
    idMap.set(mongoId, createdUser.id);
  }
  console.log(`✓ Successfully migrated ${mongoUsers.length} users to PostgreSQL.`);

  // 2. Migrate User Preferences
  const prefsColl = db.collection('userpreferences');
  const mongoPrefs = await prefsColl.find({}).toArray();
  let migratedPrefs = 0;
  for (const p of mongoPrefs) {
    const pgUserId = idMap.get(p.userId?.toString());
    if (pgUserId) {
      await prisma.userPreferences.upsert({
        where: { userId: pgUserId },
        update: {
          favoriteLanguages: p.favoriteLanguages || [],
          topics: p.topics || [],
          experienceLevel: p.experienceLevel || 'beginner',
          receiveRecommendations: p.receiveRecommendations ?? true,
          emailDigest: p.emailDigest ?? true,
          digestFrequency: p.digestFrequency || 'weekly',
          lastDigestSentAt: p.lastDigestSentAt ? new Date(p.lastDigestSentAt) : null,
        },
        create: {
          userId: pgUserId,
          favoriteLanguages: p.favoriteLanguages || [],
          topics: p.topics || [],
          experienceLevel: p.experienceLevel || 'beginner',
          receiveRecommendations: p.receiveRecommendations ?? true,
          emailDigest: p.emailDigest ?? true,
          digestFrequency: p.digestFrequency || 'weekly',
          lastDigestSentAt: p.lastDigestSentAt ? new Date(p.lastDigestSentAt) : null,
        },
      });
      migratedPrefs++;
    }
  }
  console.log(`✓ Successfully migrated ${migratedPrefs} user preferences to PostgreSQL.`);

  // 3. Migrate Saved Projects
  const projectsColl = db.collection('savedprojects');
  const mongoProjects = await projectsColl.find({}).toArray();
  let migratedProjects = 0;
  for (const p of mongoProjects) {
    const pgUserId = idMap.get(p.userId?.toString());
    if (pgUserId && p.owner && p.repo) {
      await prisma.savedProject.upsert({
        where: {
          userId_owner_repo: {
            userId: pgUserId,
            owner: p.owner,
            repo: p.repo,
          },
        },
        update: {
          notes: p.notes || '',
          tags: p.tags || [],
          metadata: p.metadata || null,
        },
        create: {
          userId: pgUserId,
          owner: p.owner,
          repo: p.repo,
          notes: p.notes || '',
          tags: p.tags || [],
          metadata: p.metadata || null,
        },
      });
      migratedProjects++;
    }
  }
  console.log(`✓ Successfully migrated ${migratedProjects} saved projects to PostgreSQL.`);

  // 4. Migrate Saved Issues
  const issuesColl = db.collection('savedissues');
  const mongoIssues = await issuesColl.find({}).toArray();
  let migratedIssues = 0;
  for (const i of mongoIssues) {
    const pgUserId = idMap.get(i.userId?.toString());
    if (pgUserId && i.issueId) {
      await prisma.savedIssue.upsert({
        where: {
          userId_issueId: {
            userId: pgUserId,
            issueId: i.issueId,
          },
        },
        update: {
          owner: i.owner || '',
          repo: i.repo || '',
          issueNumber: i.issueNumber || 0,
          notes: i.notes || '',
          tags: i.tags || [],
          status: i.status || 'todo',
          isClaimed: i.isClaimed ?? false,
          claimedAt: i.claimedAt ? new Date(i.claimedAt) : null,
          claimExpiresAt: i.claimExpiresAt ? new Date(i.claimExpiresAt) : null,
          prUrl: i.prUrl || '',
          seekingBuddy: i.seekingBuddy ?? false,
          buddyNotes: i.buddyNotes || '',
          metadata: i.metadata || null,
        },
        create: {
          userId: pgUserId,
          issueId: i.issueId,
          owner: i.owner || '',
          repo: i.repo || '',
          issueNumber: i.issueNumber || 0,
          notes: i.notes || '',
          tags: i.tags || [],
          status: i.status || 'todo',
          isClaimed: i.isClaimed ?? false,
          claimedAt: i.claimedAt ? new Date(i.claimedAt) : null,
          claimExpiresAt: i.claimExpiresAt ? new Date(i.claimExpiresAt) : null,
          prUrl: i.prUrl || '',
          seekingBuddy: i.seekingBuddy ?? false,
          buddyNotes: i.buddyNotes || '',
          metadata: i.metadata || null,
        },
      });
      migratedIssues++;
    }
  }
  console.log(`✓ Successfully migrated ${migratedIssues} saved issues to PostgreSQL.`);

  // 5. Migrate Collections
  const collectionsColl = db.collection('collections');
  const mongoCollections = await collectionsColl.find({}).toArray();
  for (const c of mongoCollections) {
    if (c.slug) {
      await prisma.collection.upsert({
        where: { slug: c.slug },
        update: {
          name: c.name || '',
          description: c.description || '',
          month: c.month || 1,
          year: c.year || 2026,
          theme: c.theme || '',
          projects: c.projects || [],
        },
        create: {
          name: c.name || '',
          slug: c.slug,
          description: c.description || '',
          month: c.month || 1,
          year: c.year || 2026,
          theme: c.theme || '',
          projects: c.projects || [],
        },
      });
    }
  }
  console.log(`✓ Successfully migrated ${mongoCollections.length} collections to PostgreSQL.`);

  await mongo.close();
  await prisma.$disconnect();
  console.log('--- MIGRATION COMPLETED SUCCESSFULLY 100% ---');
}

migrate().catch((err) => {
  console.error('Migration failed:', err);
  process.exit(1);
});
