-- Add CodeBattle to fresh databases and adopt already-present historical tables.
-- Never drop or overwrite existing battles, submissions, moderation rows or ledgers.
BEGIN;
-- CreateEnum
DO $$ BEGIN
  CREATE TYPE "BattleVisibility" AS ENUM ('PUBLIC', 'PRIVATE', 'GHOST');
EXCEPTION WHEN duplicate_object THEN NULL; END $$;
ALTER TYPE "BattleVisibility" ADD VALUE IF NOT EXISTS 'PUBLIC';
ALTER TYPE "BattleVisibility" ADD VALUE IF NOT EXISTS 'PRIVATE';
ALTER TYPE "BattleVisibility" ADD VALUE IF NOT EXISTS 'GHOST';

-- CreateEnum
DO $$ BEGIN
  CREATE TYPE "BattleState" AS ENUM ('CREATED', 'OPEN', 'INVITED', 'ACTIVE', 'SUBMITTED', 'JUDGING', 'COMPLETE', 'EXPIRED', 'ABANDONED');
EXCEPTION WHEN duplicate_object THEN NULL; END $$;
ALTER TYPE "BattleState" ADD VALUE IF NOT EXISTS 'CREATED';
ALTER TYPE "BattleState" ADD VALUE IF NOT EXISTS 'OPEN';
ALTER TYPE "BattleState" ADD VALUE IF NOT EXISTS 'INVITED';
ALTER TYPE "BattleState" ADD VALUE IF NOT EXISTS 'ACTIVE';
ALTER TYPE "BattleState" ADD VALUE IF NOT EXISTS 'SUBMITTED';
ALTER TYPE "BattleState" ADD VALUE IF NOT EXISTS 'JUDGING';
ALTER TYPE "BattleState" ADD VALUE IF NOT EXISTS 'COMPLETE';
ALTER TYPE "BattleState" ADD VALUE IF NOT EXISTS 'EXPIRED';
ALTER TYPE "BattleState" ADD VALUE IF NOT EXISTS 'ABANDONED';

-- CreateEnum
DO $$ BEGIN
  CREATE TYPE "ParticipantState" AS ENUM ('INVITED', 'JOINED', 'SUBMITTED', 'LEFT', 'REJECTED');
EXCEPTION WHEN duplicate_object THEN NULL; END $$;
ALTER TYPE "ParticipantState" ADD VALUE IF NOT EXISTS 'INVITED';
ALTER TYPE "ParticipantState" ADD VALUE IF NOT EXISTS 'JOINED';
ALTER TYPE "ParticipantState" ADD VALUE IF NOT EXISTS 'SUBMITTED';
ALTER TYPE "ParticipantState" ADD VALUE IF NOT EXISTS 'LEFT';
ALTER TYPE "ParticipantState" ADD VALUE IF NOT EXISTS 'REJECTED';

-- CreateEnum
DO $$ BEGIN
  CREATE TYPE "ProblemSource" AS ENUM ('HANDWRITTEN', 'REPO_DERIVED', 'GENERATED');
EXCEPTION WHEN duplicate_object THEN NULL; END $$;
ALTER TYPE "ProblemSource" ADD VALUE IF NOT EXISTS 'HANDWRITTEN';
ALTER TYPE "ProblemSource" ADD VALUE IF NOT EXISTS 'REPO_DERIVED';
ALTER TYPE "ProblemSource" ADD VALUE IF NOT EXISTS 'GENERATED';

-- CreateEnum
DO $$ BEGIN
  CREATE TYPE "JudgementState" AS ENUM ('PENDING', 'RUNNING', 'COMPLETE', 'FAILED');
EXCEPTION WHEN duplicate_object THEN NULL; END $$;
ALTER TYPE "JudgementState" ADD VALUE IF NOT EXISTS 'PENDING';
ALTER TYPE "JudgementState" ADD VALUE IF NOT EXISTS 'RUNNING';
ALTER TYPE "JudgementState" ADD VALUE IF NOT EXISTS 'COMPLETE';
ALTER TYPE "JudgementState" ADD VALUE IF NOT EXISTS 'FAILED';

-- CreateEnum
DO $$ BEGIN
  CREATE TYPE "BlockKind" AS ENUM ('BLOCK', 'MUTE');
EXCEPTION WHEN duplicate_object THEN NULL; END $$;
ALTER TYPE "BlockKind" ADD VALUE IF NOT EXISTS 'BLOCK';
ALTER TYPE "BlockKind" ADD VALUE IF NOT EXISTS 'MUTE';

-- CreateEnum
DO $$ BEGIN
  CREATE TYPE "ReportSubject" AS ENUM ('USER', 'MESSAGE', 'SUBMISSION');
EXCEPTION WHEN duplicate_object THEN NULL; END $$;
ALTER TYPE "ReportSubject" ADD VALUE IF NOT EXISTS 'USER';
ALTER TYPE "ReportSubject" ADD VALUE IF NOT EXISTS 'MESSAGE';
ALTER TYPE "ReportSubject" ADD VALUE IF NOT EXISTS 'SUBMISSION';

-- CreateEnum
DO $$ BEGIN
  CREATE TYPE "ReportReason" AS ENUM ('SPAM', 'HARASSMENT', 'HATE', 'SEXUAL', 'CHEATING', 'IMPERSONATION', 'OTHER');
EXCEPTION WHEN duplicate_object THEN NULL; END $$;
ALTER TYPE "ReportReason" ADD VALUE IF NOT EXISTS 'SPAM';
ALTER TYPE "ReportReason" ADD VALUE IF NOT EXISTS 'HARASSMENT';
ALTER TYPE "ReportReason" ADD VALUE IF NOT EXISTS 'HATE';
ALTER TYPE "ReportReason" ADD VALUE IF NOT EXISTS 'SEXUAL';
ALTER TYPE "ReportReason" ADD VALUE IF NOT EXISTS 'CHEATING';
ALTER TYPE "ReportReason" ADD VALUE IF NOT EXISTS 'IMPERSONATION';
ALTER TYPE "ReportReason" ADD VALUE IF NOT EXISTS 'OTHER';

-- CreateEnum
DO $$ BEGIN
  CREATE TYPE "ReportState" AS ENUM ('OPEN', 'ACTIONED', 'DISMISSED');
EXCEPTION WHEN duplicate_object THEN NULL; END $$;
ALTER TYPE "ReportState" ADD VALUE IF NOT EXISTS 'OPEN';
ALTER TYPE "ReportState" ADD VALUE IF NOT EXISTS 'ACTIONED';
ALTER TYPE "ReportState" ADD VALUE IF NOT EXISTS 'DISMISSED';

-- CreateEnum
DO $$ BEGIN
  CREATE TYPE "FlagKind" AS ENUM ('SIMILARITY');
EXCEPTION WHEN duplicate_object THEN NULL; END $$;
ALTER TYPE "FlagKind" ADD VALUE IF NOT EXISTS 'SIMILARITY';

-- CreateEnum
DO $$ BEGIN
  CREATE TYPE "FlagState" AS ENUM ('OPEN', 'CONFIRMED', 'CLEARED');
EXCEPTION WHEN duplicate_object THEN NULL; END $$;
ALTER TYPE "FlagState" ADD VALUE IF NOT EXISTS 'OPEN';
ALTER TYPE "FlagState" ADD VALUE IF NOT EXISTS 'CONFIRMED';
ALTER TYPE "FlagState" ADD VALUE IF NOT EXISTS 'CLEARED';

-- AlterTable
ALTER TABLE "users" ADD COLUMN IF NOT EXISTS "battleBanReason" TEXT NOT NULL DEFAULT '',
ADD COLUMN IF NOT EXISTS "battleBanUntil" TIMESTAMP(3);

-- CreateTable
CREATE TABLE IF NOT EXISTS "problems" (
    "id" TEXT NOT NULL,
    "slug" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "statement" TEXT NOT NULL,
    "starterCode" TEXT NOT NULL DEFAULT '',
    "language" TEXT NOT NULL,
    "difficulty" TEXT NOT NULL DEFAULT 'medium',
    "testCases" JSONB NOT NULL,
    "timeLimitMs" INTEGER NOT NULL DEFAULT 2000,
    "memoryLimitMb" INTEGER NOT NULL DEFAULT 256,
    "source" "ProblemSource" NOT NULL DEFAULT 'HANDWRITTEN',
    "reviewed" BOOLEAN NOT NULL DEFAULT false,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "problems_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE IF NOT EXISTS "battles" (
    "id" TEXT NOT NULL,
    "creatorId" TEXT NOT NULL,
    "problemId" TEXT,
    "difficulty" TEXT NOT NULL,
    "language" TEXT NOT NULL,
    "visibility" "BattleVisibility" NOT NULL,
    "state" "BattleState" NOT NULL DEFAULT 'CREATED',
    "capacity" INTEGER NOT NULL,
    "durationSeconds" INTEGER NOT NULL,
    "lobbyExpiresAt" TIMESTAMP(3) NOT NULL,
    "startedAt" TIMESTAMP(3),
    "endsAt" TIMESTAMP(3),
    "completedAt" TIMESTAMP(3),
    "finalPlayerCount" INTEGER,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "battles_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE IF NOT EXISTS "battle_queue_entries" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "difficulty" TEXT NOT NULL,
    "language" TEXT NOT NULL,
    "durationSeconds" INTEGER NOT NULL,
    "expiresAt" TIMESTAMP(3) NOT NULL,
    "matchedBattleId" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "battle_queue_entries_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE IF NOT EXISTS "battle_participants" (
    "id" TEXT NOT NULL,
    "battleId" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "state" "ParticipantState" NOT NULL DEFAULT 'JOINED',
    "joinedAt" TIMESTAMP(3),
    "isGhost" BOOLEAN NOT NULL DEFAULT false,
    "leftAt" TIMESTAMP(3),
    "rank" INTEGER,
    "invalidatedAt" TIMESTAMP(3),
    "invalidatedReason" TEXT NOT NULL DEFAULT '',
    "invalidatedById" TEXT,
    "decidedBy" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "battle_participants_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE IF NOT EXISTS "submissions" (
    "id" TEXT NOT NULL,
    "participantId" TEXT NOT NULL,
    "code" TEXT NOT NULL DEFAULT '',
    "language" TEXT NOT NULL,
    "submittedAt" TIMESTAMP(3),
    "telemetry" JSONB,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "submissions_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE IF NOT EXISTS "judgements" (
    "id" TEXT NOT NULL,
    "submissionId" TEXT NOT NULL,
    "state" "JudgementState" NOT NULL DEFAULT 'PENDING',
    "passedTests" INTEGER NOT NULL DEFAULT 0,
    "totalTests" INTEGER NOT NULL DEFAULT 0,
    "passedGate" BOOLEAN NOT NULL DEFAULT false,
    "runtimeMs" INTEGER,
    "memoryKb" INTEGER,
    "cases" JSONB,
    "scores" JSONB,
    "totalScore" DOUBLE PRECISION,
    "reasoning" TEXT,
    "model" TEXT,
    "error" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "judgements_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE IF NOT EXISTS "user_blocks" (
    "id" TEXT NOT NULL,
    "blockerId" TEXT NOT NULL,
    "blockedId" TEXT NOT NULL,
    "kind" "BlockKind" NOT NULL DEFAULT 'BLOCK',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "user_blocks_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE IF NOT EXISTS "reports" (
    "id" TEXT NOT NULL,
    "reporterId" TEXT NOT NULL,
    "subjectUserId" TEXT NOT NULL,
    "subjectType" "ReportSubject" NOT NULL DEFAULT 'USER',
    "subjectId" TEXT NOT NULL DEFAULT '',
    "reason" "ReportReason" NOT NULL DEFAULT 'OTHER',
    "detail" TEXT NOT NULL DEFAULT '',
    "evidence" TEXT NOT NULL DEFAULT '',
    "state" "ReportState" NOT NULL DEFAULT 'OPEN',
    "resolutionNote" TEXT NOT NULL DEFAULT '',
    "resolvedById" TEXT,
    "resolvedAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "reports_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE IF NOT EXISTS "battle_flags" (
    "id" TEXT NOT NULL,
    "battleId" TEXT NOT NULL,
    "kind" "FlagKind" NOT NULL DEFAULT 'SIMILARITY',
    "state" "FlagState" NOT NULL DEFAULT 'OPEN',
    "participantAId" TEXT NOT NULL,
    "participantBId" TEXT NOT NULL,
    "score" DOUBLE PRECISION NOT NULL DEFAULT 0,
    "detail" TEXT NOT NULL DEFAULT '',
    "reviewNote" TEXT NOT NULL DEFAULT '',
    "reviewedById" TEXT,
    "reviewedAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "battle_flags_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE IF NOT EXISTS "_applied_sql_migrations" (
    "name" TEXT NOT NULL,
    "applied_at" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "_applied_sql_migrations_pkey" PRIMARY KEY ("name")
);

-- CreateIndex
CREATE UNIQUE INDEX IF NOT EXISTS "problems_slug_key" ON "problems"("slug");

-- CreateIndex
CREATE INDEX IF NOT EXISTS "problems_reviewed_language_idx" ON "problems"("reviewed", "language");

-- CreateIndex
CREATE INDEX IF NOT EXISTS "battles_state_visibility_createdAt_idx" ON "battles"("state", "visibility", "createdAt");

-- CreateIndex
CREATE INDEX IF NOT EXISTS "battles_creatorId_idx" ON "battles"("creatorId");

-- CreateIndex
CREATE INDEX IF NOT EXISTS "battles_state_lobbyExpiresAt_idx" ON "battles"("state", "lobbyExpiresAt");

-- CreateIndex
CREATE INDEX IF NOT EXISTS "battles_state_endsAt_idx" ON "battles"("state", "endsAt");

-- CreateIndex
CREATE INDEX IF NOT EXISTS "battles_difficulty_language_idx" ON "battles"("difficulty", "language");

-- CreateIndex
CREATE UNIQUE INDEX IF NOT EXISTS "battle_queue_entries_userId_key" ON "battle_queue_entries"("userId");

-- CreateIndex
CREATE INDEX IF NOT EXISTS "battle_queue_entries_pool_idx" ON "battle_queue_entries"("difficulty", "language", "durationSeconds", "matchedBattleId", "createdAt");

-- CreateIndex
CREATE INDEX IF NOT EXISTS "battle_queue_entries_expiresAt_idx" ON "battle_queue_entries"("expiresAt");

-- CreateIndex
CREATE INDEX IF NOT EXISTS "battle_participants_userId_createdAt_idx" ON "battle_participants"("userId", "createdAt");

-- CreateIndex
CREATE UNIQUE INDEX IF NOT EXISTS "battle_participants_battleId_userId_key" ON "battle_participants"("battleId", "userId");

-- CreateIndex
CREATE UNIQUE INDEX IF NOT EXISTS "submissions_participantId_key" ON "submissions"("participantId");

-- CreateIndex
CREATE UNIQUE INDEX IF NOT EXISTS "judgements_submissionId_key" ON "judgements"("submissionId");

-- CreateIndex
CREATE INDEX IF NOT EXISTS "user_blocks_blockerId_idx" ON "user_blocks"("blockerId");

-- CreateIndex
CREATE INDEX IF NOT EXISTS "user_blocks_blockedId_idx" ON "user_blocks"("blockedId");

-- CreateIndex
CREATE UNIQUE INDEX IF NOT EXISTS "user_blocks_blockerId_blockedId_key" ON "user_blocks"("blockerId", "blockedId");

-- CreateIndex
CREATE INDEX IF NOT EXISTS "reports_state_createdAt_idx" ON "reports"("state", "createdAt");

-- CreateIndex
CREATE INDEX IF NOT EXISTS "reports_subjectUserId_idx" ON "reports"("subjectUserId");

-- CreateIndex
CREATE INDEX IF NOT EXISTS "battle_flags_state_createdAt_idx" ON "battle_flags"("state", "createdAt");

-- CreateIndex
CREATE INDEX IF NOT EXISTS "battle_flags_battleId_idx" ON "battle_flags"("battleId");

-- CreateIndex
CREATE UNIQUE INDEX IF NOT EXISTS "battle_flags_participantAId_participantBId_key" ON "battle_flags"("participantAId", "participantBId");

-- AddForeignKey
DO $$ BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'battles_creatorId_fkey' AND conrelid = '"battles"'::regclass) THEN
    ALTER TABLE "battles" ADD CONSTRAINT "battles_creatorId_fkey" FOREIGN KEY ("creatorId") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;
  END IF;
END $$;

-- AddForeignKey
DO $$ BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'battles_problemId_fkey' AND conrelid = '"battles"'::regclass) THEN
    ALTER TABLE "battles" ADD CONSTRAINT "battles_problemId_fkey" FOREIGN KEY ("problemId") REFERENCES "problems"("id") ON DELETE SET NULL ON UPDATE CASCADE;
  END IF;
END $$;

-- AddForeignKey
DO $$ BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'battle_queue_entries_userId_fkey' AND conrelid = '"battle_queue_entries"'::regclass) THEN
    ALTER TABLE "battle_queue_entries" ADD CONSTRAINT "battle_queue_entries_userId_fkey" FOREIGN KEY ("userId") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;
  END IF;
END $$;

-- AddForeignKey
DO $$ BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'battle_queue_entries_matchedBattleId_fkey' AND conrelid = '"battle_queue_entries"'::regclass) THEN
    ALTER TABLE "battle_queue_entries" ADD CONSTRAINT "battle_queue_entries_matchedBattleId_fkey" FOREIGN KEY ("matchedBattleId") REFERENCES "battles"("id") ON DELETE SET NULL ON UPDATE CASCADE;
  END IF;
END $$;

-- AddForeignKey
DO $$ BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'battle_participants_battleId_fkey' AND conrelid = '"battle_participants"'::regclass) THEN
    ALTER TABLE "battle_participants" ADD CONSTRAINT "battle_participants_battleId_fkey" FOREIGN KEY ("battleId") REFERENCES "battles"("id") ON DELETE CASCADE ON UPDATE CASCADE;
  END IF;
END $$;

-- AddForeignKey
DO $$ BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'battle_participants_userId_fkey' AND conrelid = '"battle_participants"'::regclass) THEN
    ALTER TABLE "battle_participants" ADD CONSTRAINT "battle_participants_userId_fkey" FOREIGN KEY ("userId") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;
  END IF;
END $$;

-- AddForeignKey
DO $$ BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'battle_participants_invalidatedById_fkey' AND conrelid = '"battle_participants"'::regclass) THEN
    ALTER TABLE "battle_participants" ADD CONSTRAINT "battle_participants_invalidatedById_fkey" FOREIGN KEY ("invalidatedById") REFERENCES "users"("id") ON DELETE SET NULL ON UPDATE CASCADE;
  END IF;
END $$;

-- AddForeignKey
DO $$ BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'submissions_participantId_fkey' AND conrelid = '"submissions"'::regclass) THEN
    ALTER TABLE "submissions" ADD CONSTRAINT "submissions_participantId_fkey" FOREIGN KEY ("participantId") REFERENCES "battle_participants"("id") ON DELETE CASCADE ON UPDATE CASCADE;
  END IF;
END $$;

-- AddForeignKey
DO $$ BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'judgements_submissionId_fkey' AND conrelid = '"judgements"'::regclass) THEN
    ALTER TABLE "judgements" ADD CONSTRAINT "judgements_submissionId_fkey" FOREIGN KEY ("submissionId") REFERENCES "submissions"("id") ON DELETE CASCADE ON UPDATE CASCADE;
  END IF;
END $$;

-- AddForeignKey
DO $$ BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'user_blocks_blockerId_fkey' AND conrelid = '"user_blocks"'::regclass) THEN
    ALTER TABLE "user_blocks" ADD CONSTRAINT "user_blocks_blockerId_fkey" FOREIGN KEY ("blockerId") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;
  END IF;
END $$;

-- AddForeignKey
DO $$ BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'user_blocks_blockedId_fkey' AND conrelid = '"user_blocks"'::regclass) THEN
    ALTER TABLE "user_blocks" ADD CONSTRAINT "user_blocks_blockedId_fkey" FOREIGN KEY ("blockedId") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;
  END IF;
END $$;

-- AddForeignKey
DO $$ BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'reports_reporterId_fkey' AND conrelid = '"reports"'::regclass) THEN
    ALTER TABLE "reports" ADD CONSTRAINT "reports_reporterId_fkey" FOREIGN KEY ("reporterId") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;
  END IF;
END $$;

-- AddForeignKey
DO $$ BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'reports_subjectUserId_fkey' AND conrelid = '"reports"'::regclass) THEN
    ALTER TABLE "reports" ADD CONSTRAINT "reports_subjectUserId_fkey" FOREIGN KEY ("subjectUserId") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;
  END IF;
END $$;

-- AddForeignKey
DO $$ BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'reports_resolvedById_fkey' AND conrelid = '"reports"'::regclass) THEN
    ALTER TABLE "reports" ADD CONSTRAINT "reports_resolvedById_fkey" FOREIGN KEY ("resolvedById") REFERENCES "users"("id") ON DELETE SET NULL ON UPDATE CASCADE;
  END IF;
END $$;

-- AddForeignKey
DO $$ BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'battle_flags_battleId_fkey' AND conrelid = '"battle_flags"'::regclass) THEN
    ALTER TABLE "battle_flags" ADD CONSTRAINT "battle_flags_battleId_fkey" FOREIGN KEY ("battleId") REFERENCES "battles"("id") ON DELETE CASCADE ON UPDATE CASCADE;
  END IF;
END $$;

-- AddForeignKey
DO $$ BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'battle_flags_participantAId_fkey' AND conrelid = '"battle_flags"'::regclass) THEN
    ALTER TABLE "battle_flags" ADD CONSTRAINT "battle_flags_participantAId_fkey" FOREIGN KEY ("participantAId") REFERENCES "battle_participants"("id") ON DELETE CASCADE ON UPDATE CASCADE;
  END IF;
END $$;

-- AddForeignKey
DO $$ BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'battle_flags_participantBId_fkey' AND conrelid = '"battle_flags"'::regclass) THEN
    ALTER TABLE "battle_flags" ADD CONSTRAINT "battle_flags_participantBId_fkey" FOREIGN KEY ("participantBId") REFERENCES "battle_participants"("id") ON DELETE CASCADE ON UPDATE CASCADE;
  END IF;
END $$;

-- AddForeignKey
DO $$ BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'battle_flags_reviewedById_fkey' AND conrelid = '"battle_flags"'::regclass) THEN
    ALTER TABLE "battle_flags" ADD CONSTRAINT "battle_flags_reviewedById_fkey" FOREIGN KEY ("reviewedById") REFERENCES "users"("id") ON DELETE SET NULL ON UPDATE CASCADE;
  END IF;
END $$;

COMMIT;
