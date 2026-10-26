-- DropForeignKey
ALTER TABLE "battles" DROP CONSTRAINT "battles_problemId_fkey";

-- AlterTable
ALTER TABLE "battles" ADD COLUMN     "difficulty" TEXT NOT NULL,
ADD COLUMN     "language" TEXT NOT NULL,
ALTER COLUMN "problemId" DROP NOT NULL;

-- CreateIndex
CREATE INDEX "battles_difficulty_language_idx" ON "battles"("difficulty", "language");

-- AddForeignKey
ALTER TABLE "battles" ADD CONSTRAINT "battles_problemId_fkey" FOREIGN KEY ("problemId") REFERENCES "problems"("id") ON DELETE SET NULL ON UPDATE CASCADE;
