ALTER TABLE "problems" ADD COLUMN "category" TEXT NOT NULL DEFAULT 'ARRAYS_HASHING';
ALTER TABLE "practice_attempts" ADD COLUMN "analysis" JSONB;
ALTER TABLE "arena_tournaments" ADD COLUMN "format" TEXT NOT NULL DEFAULT 'ELIMINATION';
ALTER TABLE "arena_tournaments" ADD COLUMN "roundLimit" INTEGER NOT NULL DEFAULT 3;
CREATE TABLE "arena_series" (
 "id" TEXT PRIMARY KEY, "kind" TEXT NOT NULL, "ownerId" TEXT NOT NULL,
 "state" TEXT NOT NULL DEFAULT 'INVITED', "language" TEXT NOT NULL, "difficulty" TEXT NOT NULL, "durationSeconds" INTEGER NOT NULL,
 "teamA" TEXT[] NOT NULL, "teamB" TEXT[] NOT NULL, "accepted" TEXT[] NOT NULL,
 "clanAId" TEXT, "clanBId" TEXT, "currentBattleId" TEXT,
 "rounds" JSONB NOT NULL DEFAULT '[]', "winsA" INTEGER NOT NULL DEFAULT 0, "winsB" INTEGER NOT NULL DEFAULT 0,
 "winnerTeam" INTEGER, "codeA" TEXT NOT NULL DEFAULT '', "codeB" TEXT NOT NULL DEFAULT '',
 "revisionA" INTEGER NOT NULL DEFAULT 0, "revisionB" INTEGER NOT NULL DEFAULT 0,
 "submittedA" BOOLEAN NOT NULL DEFAULT false, "submittedB" BOOLEAN NOT NULL DEFAULT false,
 "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP, "updatedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP
);
CREATE INDEX "arena_series_state_createdAt_idx" ON "arena_series"("state", "createdAt");
ALTER TABLE "battles" ADD COLUMN "spectatorToken" TEXT;
CREATE UNIQUE INDEX "battles_spectatorToken_key" ON "battles"("spectatorToken");
ALTER TABLE "battles" ADD COLUMN "seriesId" TEXT REFERENCES "arena_series"("id") ON DELETE SET NULL;
