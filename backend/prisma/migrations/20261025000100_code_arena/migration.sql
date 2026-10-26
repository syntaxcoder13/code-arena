CREATE TABLE "arena_accounts" (
  "userId" TEXT PRIMARY KEY REFERENCES "users"("id") ON DELETE CASCADE,
  "settings" JSONB NOT NULL DEFAULT '{}',
  "bookmarks" TEXT[] NOT NULL DEFAULT ARRAY[]::TEXT[],
  "updatedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP
);
CREATE TABLE "practice_attempts" (
  "id" TEXT PRIMARY KEY,
  "userId" TEXT NOT NULL REFERENCES "users"("id") ON DELETE CASCADE,
  "problemId" TEXT NOT NULL,
  "language" TEXT NOT NULL,
  "passed" BOOLEAN NOT NULL,
  "passedTests" INTEGER NOT NULL,
  "totalTests" INTEGER NOT NULL,
  "runtimeMs" INTEGER,
  "memoryKb" INTEGER,
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP
);
CREATE INDEX "practice_attempts_userId_createdAt_idx" ON "practice_attempts"("userId", "createdAt");
CREATE TABLE "arena_feedback" (
  "id" TEXT PRIMARY KEY,
  "userId" TEXT NOT NULL REFERENCES "users"("id") ON DELETE CASCADE,
  "category" TEXT NOT NULL,
  "message" TEXT NOT NULL,
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP
);
