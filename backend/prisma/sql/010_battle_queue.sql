-- A short wait for a live opponent before falling back to a ghost.
--
-- Ghost mode exists because an empty lobby is what loses a player for good.
-- It solved that, but it solved it too completely: two people can click
-- "race a ghost" within seconds of each other and both get a recording,
-- while the live opponent they wanted was right there.
--
-- So: a queue of people who want a battle now, held for a few seconds. Two
-- compatible entries become a real battle; an entry nobody matches falls
-- back to the ghost it would have got anyway. The fallback is what keeps
-- this safe to add - the worst case is the behaviour we already had, a few
-- seconds later.

CREATE TABLE "battle_queue_entries" (
  "id"              TEXT NOT NULL,
  "userId"          TEXT NOT NULL,
  "difficulty"      TEXT NOT NULL,
  "language"        TEXT NOT NULL,
  "durationSeconds" INTEGER NOT NULL,
  -- The moment this entry stops waiting and takes a ghost instead. Stored
  -- rather than computed from createdAt so the wait can be changed later
  -- without silently retiming everybody already queued.
  "expiresAt"       TIMESTAMP(3) NOT NULL,
  -- Set when this entry has been paired. Also the claim: a matcher wins an
  -- opponent by being the one whose UPDATE ... WHERE "matchedBattleId" IS
  -- NULL affects a row, so two simultaneous matchers cannot both take the
  -- same person and open two battles.
  "matchedBattleId" TEXT,
  "createdAt"       TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

  CONSTRAINT "battle_queue_entries_pkey" PRIMARY KEY ("id")
);

-- One queue entry per person. Clicking twice should not put somebody in the
-- queue twice and let them be matched against themselves from both sides.
CREATE UNIQUE INDEX "battle_queue_entries_userId_key"
  ON "battle_queue_entries"("userId");

-- The matcher's only read: unmatched entries in my pool, oldest first, so
-- the person who has been waiting longest is taken first.
CREATE INDEX "battle_queue_entries_pool_idx"
  ON "battle_queue_entries"("difficulty", "language", "durationSeconds", "matchedBattleId", "createdAt");

-- The sweeper's read.
CREATE INDEX "battle_queue_entries_expiresAt_idx"
  ON "battle_queue_entries"("expiresAt");

ALTER TABLE "battle_queue_entries"
  ADD CONSTRAINT "battle_queue_entries_userId_fkey"
  FOREIGN KEY ("userId") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

ALTER TABLE "battle_queue_entries"
  ADD CONSTRAINT "battle_queue_entries_matchedBattleId_fkey"
  FOREIGN KEY ("matchedBattleId") REFERENCES "battles"("id") ON DELETE SET NULL ON UPDATE CASCADE;
