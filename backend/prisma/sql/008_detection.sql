-- Phase 15: detection and consequences.

-- A flag is a pair of submissions in one battle that look too alike to have
-- been written separately. One row per pair, not per person: similarity is a
-- relationship, and a row that named one side would be asserting who copied
-- whom, which the measurement cannot tell.
CREATE TYPE "FlagKind" AS ENUM ('SIMILARITY');
CREATE TYPE "FlagState" AS ENUM ('OPEN', 'CONFIRMED', 'CLEARED');

CREATE TABLE "battle_flags" (
  "id"         TEXT NOT NULL,
  "battleId"   TEXT NOT NULL,
  "kind"       "FlagKind" NOT NULL DEFAULT 'SIMILARITY',
  "state"      "FlagState" NOT NULL DEFAULT 'OPEN',
  -- The two participants, in a stable order so the same pair cannot be
  -- flagged twice under two spellings.
  "participantAId" TEXT NOT NULL,
  "participantBId" TEXT NOT NULL,
  -- 0..1. Stored so a reviewer sees what the detector actually measured
  -- rather than only that it fired.
  "score"      DOUBLE PRECISION NOT NULL DEFAULT 0,
  -- How it was reached, in words, for somebody who has to justify a decision.
  "detail"     TEXT NOT NULL DEFAULT '',
  "reviewNote" TEXT NOT NULL DEFAULT '',
  "reviewedById" TEXT,
  "reviewedAt" TIMESTAMP(3),
  "createdAt"  TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

  CONSTRAINT "battle_flags_pkey" PRIMARY KEY ("id")
);

-- Re-running the detector over a battle must not stack duplicates.
CREATE UNIQUE INDEX "battle_flags_pair_key"
  ON "battle_flags"("participantAId", "participantBId");
CREATE INDEX "battle_flags_state_createdAt_idx" ON "battle_flags"("state", "createdAt");
CREATE INDEX "battle_flags_battleId_idx" ON "battle_flags"("battleId");

ALTER TABLE "battle_flags" ADD CONSTRAINT "battle_flags_battleId_fkey"
  FOREIGN KEY ("battleId") REFERENCES "battles"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "battle_flags" ADD CONSTRAINT "battle_flags_participantAId_fkey"
  FOREIGN KEY ("participantAId") REFERENCES "battle_participants"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "battle_flags" ADD CONSTRAINT "battle_flags_participantBId_fkey"
  FOREIGN KEY ("participantBId") REFERENCES "battle_participants"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "battle_flags" ADD CONSTRAINT "battle_flags_reviewedById_fkey"
  FOREIGN KEY ("reviewedById") REFERENCES "users"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- An invalidated result keeps its row and loses its placing. Deleting it
-- would make the results screen disagree with itself, and would hide that
-- anything happened - which is the opposite of the point. In a small
-- community a consequence nobody can see does less than one they can.
ALTER TABLE "battle_participants" ADD COLUMN "invalidatedAt" TIMESTAMP(3);
ALTER TABLE "battle_participants" ADD COLUMN "invalidatedReason" TEXT NOT NULL DEFAULT '';
ALTER TABLE "battle_participants" ADD COLUMN "invalidatedById" TEXT;
ALTER TABLE "battle_participants" ADD CONSTRAINT "battle_participants_invalidatedById_fkey"
  FOREIGN KEY ("invalidatedById") REFERENCES "users"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- Losing battle access is a date rather than a flag, so it ends by itself.
-- A ban that has to be lifted by hand is a ban that never gets lifted.
ALTER TABLE "users" ADD COLUMN "battleBanUntil" TIMESTAMP(3);
ALTER TABLE "users" ADD COLUMN "battleBanReason" TEXT NOT NULL DEFAULT '';
CREATE INDEX "users_battleBanUntil_idx" ON "users"("battleBanUntil");

-- The daily sandbox cap counts handed-in submissions per person per day, so
-- it needs to find them by person and time. The existing index is on the
-- participant, which is the wrong way round for that question.
CREATE INDEX "submissions_submittedAt_idx" ON "submissions"("submittedAt");
