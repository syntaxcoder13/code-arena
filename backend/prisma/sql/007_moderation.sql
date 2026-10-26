-- Phase 16: moderation. Somebody has to be able to remove another person from
-- their own experience without asking us to do it for them.

-- A block is hard and mutual in effect: neither can start a conversation,
-- message, or be drawn into a battle with the other. A mute is soft and
-- one-directional: their messages still arrive and can still be read, they
-- just stop demanding attention.
--
-- Both live in one table because they are the same relationship at two
-- strengths, and a person moving between them should not leave a stale row of
-- the other kind behind.
CREATE TYPE "BlockKind" AS ENUM ('BLOCK', 'MUTE');

CREATE TABLE "user_blocks" (
  "id"        TEXT NOT NULL,
  "blockerId" TEXT NOT NULL,
  "blockedId" TEXT NOT NULL,
  "kind"      "BlockKind" NOT NULL DEFAULT 'BLOCK',
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

  CONSTRAINT "user_blocks_pkey" PRIMARY KEY ("id")
);

-- One row per pair per direction, so blocking twice is not two rows and a
-- change of kind is an update rather than a duplicate.
CREATE UNIQUE INDEX "user_blocks_blockerId_blockedId_key"
  ON "user_blocks"("blockerId", "blockedId");
CREATE INDEX "user_blocks_blockerId_idx" ON "user_blocks"("blockerId");
-- Read in the other direction just as often: every check asks "did they block
-- me?" as well as "did I block them?".
CREATE INDEX "user_blocks_blockedId_idx" ON "user_blocks"("blockedId");

ALTER TABLE "user_blocks" ADD CONSTRAINT "user_blocks_blockerId_fkey"
  FOREIGN KEY ("blockerId") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "user_blocks" ADD CONSTRAINT "user_blocks_blockedId_fkey"
  FOREIGN KEY ("blockedId") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- A report always names a person, and may additionally point at the one
-- message or submission that prompted it. Naming the person is what makes the
-- queue reviewable: three reports about the same account is the signal, and a
-- report that only knew about a message id would not show that.
CREATE TYPE "ReportSubject" AS ENUM ('USER', 'MESSAGE', 'SUBMISSION');
CREATE TYPE "ReportReason" AS ENUM ('SPAM', 'HARASSMENT', 'HATE', 'SEXUAL', 'CHEATING', 'IMPERSONATION', 'OTHER');
CREATE TYPE "ReportState" AS ENUM ('OPEN', 'ACTIONED', 'DISMISSED');

CREATE TABLE "reports" (
  "id"             TEXT NOT NULL,
  "reporterId"     TEXT NOT NULL,
  "subjectUserId"  TEXT NOT NULL,
  "subjectType"    "ReportSubject" NOT NULL DEFAULT 'USER',
  -- The message or submission, when there is one. Deliberately not a foreign
  -- key: a report must survive the thing it is about being deleted, or the
  -- fastest way to clear the queue would be to delete the evidence.
  "subjectId"      TEXT NOT NULL DEFAULT '',
  "reason"         "ReportReason" NOT NULL DEFAULT 'OTHER',
  "detail"         TEXT NOT NULL DEFAULT '',
  -- Copied at the time of reporting, for the same reason.
  "evidence"       TEXT NOT NULL DEFAULT '',
  "state"          "ReportState" NOT NULL DEFAULT 'OPEN',
  "resolutionNote" TEXT NOT NULL DEFAULT '',
  "resolvedById"   TEXT,
  "resolvedAt"     TIMESTAMP(3),
  "createdAt"      TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

  CONSTRAINT "reports_pkey" PRIMARY KEY ("id")
);

-- The queue is read as "everything still open, oldest first".
CREATE INDEX "reports_state_createdAt_idx" ON "reports"("state", "createdAt");
-- And a reviewer's first question about any report is what else this account
-- has been reported for.
CREATE INDEX "reports_subjectUserId_idx" ON "reports"("subjectUserId");

-- One open report per person per target: a second click is not a second
-- report, and it stops one person stacking the queue against somebody.
-- Partial, so the same pair can be reported again after the first is resolved.
CREATE UNIQUE INDEX "reports_reporterId_subjectUserId_open_key"
  ON "reports"("reporterId", "subjectUserId") WHERE "state" = 'OPEN';

ALTER TABLE "reports" ADD CONSTRAINT "reports_reporterId_fkey"
  FOREIGN KEY ("reporterId") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "reports" ADD CONSTRAINT "reports_subjectUserId_fkey"
  FOREIGN KEY ("subjectUserId") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "reports" ADD CONSTRAINT "reports_resolvedById_fkey"
  FOREIGN KEY ("resolvedById") REFERENCES "users"("id") ON DELETE SET NULL ON UPDATE CASCADE;
