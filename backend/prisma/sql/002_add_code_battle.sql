-- CreateEnum
CREATE TYPE "BattleVisibility" AS ENUM ('PUBLIC', 'PRIVATE');

-- CreateEnum
CREATE TYPE "BattleState" AS ENUM ('CREATED', 'OPEN', 'INVITED', 'ACTIVE', 'SUBMITTED', 'JUDGING', 'COMPLETE', 'EXPIRED', 'ABANDONED');

-- CreateEnum
CREATE TYPE "ParticipantState" AS ENUM ('INVITED', 'JOINED', 'SUBMITTED', 'LEFT', 'REJECTED');

-- CreateEnum
CREATE TYPE "ProblemSource" AS ENUM ('HANDWRITTEN', 'REPO_DERIVED');

-- CreateEnum
CREATE TYPE "JudgementState" AS ENUM ('PENDING', 'RUNNING', 'COMPLETE', 'FAILED');

-- CreateTable
CREATE TABLE "problems" (
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
CREATE TABLE "battles" (
    "id" TEXT NOT NULL,
    "creatorId" TEXT NOT NULL,
    "problemId" TEXT NOT NULL,
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
CREATE TABLE "battle_participants" (
    "id" TEXT NOT NULL,
    "battleId" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "state" "ParticipantState" NOT NULL DEFAULT 'JOINED',
    "joinedAt" TIMESTAMP(3),
    "leftAt" TIMESTAMP(3),
    "rank" INTEGER,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "battle_participants_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "submissions" (
    "id" TEXT NOT NULL,
    "participantId" TEXT NOT NULL,
    "code" TEXT NOT NULL DEFAULT '',
    "language" TEXT NOT NULL,
    "submittedAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "submissions_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "judgements" (
    "id" TEXT NOT NULL,
    "submissionId" TEXT NOT NULL,
    "state" "JudgementState" NOT NULL DEFAULT 'PENDING',
    "passedTests" INTEGER NOT NULL DEFAULT 0,
    "totalTests" INTEGER NOT NULL DEFAULT 0,
    "passedGate" BOOLEAN NOT NULL DEFAULT false,
    "runtimeMs" INTEGER,
    "memoryKb" INTEGER,
    "scores" JSONB,
    "totalScore" DOUBLE PRECISION,
    "reasoning" TEXT,
    "model" TEXT,
    "error" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "judgements_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "problems_slug_key" ON "problems"("slug");

-- CreateIndex
CREATE INDEX "problems_reviewed_language_idx" ON "problems"("reviewed", "language");

-- CreateIndex
CREATE INDEX "battles_state_visibility_createdAt_idx" ON "battles"("state", "visibility", "createdAt");

-- CreateIndex
CREATE INDEX "battles_creatorId_idx" ON "battles"("creatorId");

-- CreateIndex
CREATE INDEX "battles_state_lobbyExpiresAt_idx" ON "battles"("state", "lobbyExpiresAt");

-- CreateIndex
CREATE INDEX "battles_state_endsAt_idx" ON "battles"("state", "endsAt");

-- CreateIndex
CREATE INDEX "battle_participants_userId_createdAt_idx" ON "battle_participants"("userId", "createdAt");

-- CreateIndex
CREATE UNIQUE INDEX "battle_participants_battleId_userId_key" ON "battle_participants"("battleId", "userId");

-- CreateIndex
CREATE UNIQUE INDEX "submissions_participantId_key" ON "submissions"("participantId");

-- CreateIndex
CREATE UNIQUE INDEX "judgements_submissionId_key" ON "judgements"("submissionId");

-- AddForeignKey
ALTER TABLE "battles" ADD CONSTRAINT "battles_creatorId_fkey" FOREIGN KEY ("creatorId") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "battles" ADD CONSTRAINT "battles_problemId_fkey" FOREIGN KEY ("problemId") REFERENCES "problems"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "battle_participants" ADD CONSTRAINT "battle_participants_battleId_fkey" FOREIGN KEY ("battleId") REFERENCES "battles"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "battle_participants" ADD CONSTRAINT "battle_participants_userId_fkey" FOREIGN KEY ("userId") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "submissions" ADD CONSTRAINT "submissions_participantId_fkey" FOREIGN KEY ("participantId") REFERENCES "battle_participants"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "judgements" ADD CONSTRAINT "judgements_submissionId_fkey" FOREIGN KEY ("submissionId") REFERENCES "submissions"("id") ON DELETE CASCADE ON UPDATE CASCADE;
