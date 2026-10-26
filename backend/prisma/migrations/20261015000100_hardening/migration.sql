BEGIN;
-- Additive settings and retry identity fields.
ALTER TABLE "user_preferences"
  ADD COLUMN "issueRecommendations" BOOLEAN NOT NULL DEFAULT true,
  ADD COLUMN "preferredDifficulty" TEXT[] NOT NULL DEFAULT ARRAY['beginner']::TEXT[],
  ADD COLUMN "contributionAreas" TEXT[] NOT NULL DEFAULT ARRAY[]::TEXT[];
UPDATE "user_preferences" SET "preferredDifficulty" = ARRAY["experienceLevel"]::TEXT[];

ALTER TABLE "messages" ADD COLUMN "clientMessageId" TEXT;
CREATE UNIQUE INDEX "messages_conversationId_senderId_clientMessageId_key"
  ON "messages"("conversationId", "senderId", "clientMessageId");
CREATE INDEX "messages_conversationId_createdAt_id_idx" ON "messages"("conversationId", "createdAt", "id");

CREATE TABLE "digest_dispatches" (
  "key" TEXT PRIMARY KEY,
  "userId" TEXT NOT NULL,
  "status" TEXT NOT NULL DEFAULT 'sending',
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt" TIMESTAMP(3) NOT NULL
);
CREATE INDEX "digest_dispatches_userId_idx" ON "digest_dispatches"("userId");
ALTER TABLE "digest_dispatches" ADD CONSTRAINT "digest_dispatches_userId_fkey"
  FOREIGN KEY ("userId") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- Consolidate numeric, legacy and canonical IDs before adding reference uniqueness.
-- Archive every original row in the database so notes/workflow details remain
-- recoverable even when several legacy rows describe the same issue.
CREATE TABLE "saved_issue_identity_archive_20261015" AS TABLE "saved_issues" WITH NO DATA;
INSERT INTO "saved_issue_identity_archive_20261015" SELECT * FROM "saved_issues";

CREATE TEMP TABLE issue_merge ON COMMIT DROP AS
SELECT "userId", lower(owner) AS owner, lower(repo) AS repo, "issueNumber",
  (array_agg(id ORDER BY "updatedAt" DESC, id DESC))[1] AS keep_id,
  bool_or("seekingBuddy") AS buddy,
  bool_or("isClaimed" AND "claimExpiresAt" > CURRENT_TIMESTAMP) AS claimed,
  max("claimExpiresAt") AS expires,
  string_agg(DISTINCT NULLIF(notes, ''), E'\n\n') AS notes,
  string_agg(DISTINCT NULLIF("buddyNotes", ''), E'\n\n') AS buddy_notes
FROM "saved_issues" GROUP BY "userId", lower(owner), lower(repo), "issueNumber";

UPDATE "saved_issues" s SET
  notes = COALESCE(m.notes, ''), "buddyNotes" = COALESCE(m.buddy_notes, ''),
  "seekingBuddy" = m.buddy, "isClaimed" = m.claimed,
  "claimExpiresAt" = CASE WHEN m.claimed THEN m.expires ELSE NULL END
FROM issue_merge m WHERE s.id = m.keep_id;
DELETE FROM "saved_issues" s USING issue_merge m
WHERE s."userId" = m."userId" AND lower(s.owner) = m.owner AND lower(s.repo) = m.repo
  AND s."issueNumber" = m."issueNumber" AND s.id <> m.keep_id;
-- Free old unique issue IDs before assigning normalized identities.
UPDATE "saved_issues" SET "issueId" = 'migration:' || id;
UPDATE "saved_issues" SET owner = lower(owner), repo = lower(repo),
  "issueId" = lower(owner) || '/' || lower(repo) || '#' || "issueNumber";
CREATE UNIQUE INDEX "saved_issues_userId_owner_repo_issueNumber_key"
  ON "saved_issues"("userId", owner, repo, "issueNumber");
COMMIT;
