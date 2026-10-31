CREATE TABLE "arena_clans" (
 "id" TEXT PRIMARY KEY, "name" TEXT NOT NULL UNIQUE, "tag" TEXT NOT NULL UNIQUE,
 "description" TEXT NOT NULL DEFAULT '', "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP
);
CREATE TABLE "arena_clan_members" (
 "userId" TEXT PRIMARY KEY REFERENCES "users"("id") ON DELETE CASCADE,
 "clanId" TEXT NOT NULL REFERENCES "arena_clans"("id") ON DELETE CASCADE,
 "role" TEXT NOT NULL DEFAULT 'MEMBER', "joinedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP
);
CREATE INDEX "arena_clan_members_clanId_idx" ON "arena_clan_members"("clanId");
CREATE TABLE "arena_tournaments" (
 "id" TEXT PRIMARY KEY, "name" TEXT NOT NULL, "creatorId" TEXT NOT NULL,
 "state" TEXT NOT NULL DEFAULT 'OPEN', "difficulty" TEXT NOT NULL, "language" TEXT NOT NULL,
 "durationSeconds" INTEGER NOT NULL, "capacity" INTEGER NOT NULL,
 "winnerId" TEXT, "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP, "startedAt" TIMESTAMP(3)
);
CREATE INDEX "arena_tournaments_state_createdAt_idx" ON "arena_tournaments"("state", "createdAt");
CREATE TABLE "arena_tournament_entries" (
 "id" TEXT PRIMARY KEY, "tournamentId" TEXT NOT NULL REFERENCES "arena_tournaments"("id") ON DELETE CASCADE,
 "userId" TEXT NOT NULL REFERENCES "users"("id") ON DELETE CASCADE,
 "joinedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
 CONSTRAINT "arena_tournament_entries_tournamentId_userId_key" UNIQUE ("tournamentId", "userId")
);
CREATE TABLE "arena_tournament_matches" (
 "id" TEXT PRIMARY KEY, "tournamentId" TEXT NOT NULL REFERENCES "arena_tournaments"("id") ON DELETE CASCADE,
 "round" INTEGER NOT NULL, "position" INTEGER NOT NULL, "playerAId" TEXT NOT NULL,
 "playerBId" TEXT, "winnerId" TEXT, "resolution" TEXT,
 "battleId" TEXT UNIQUE REFERENCES "battles"("id") ON DELETE SET NULL,
 CONSTRAINT "arena_tournament_matches_tournamentId_round_position_key" UNIQUE ("tournamentId", "round", "position")
);
