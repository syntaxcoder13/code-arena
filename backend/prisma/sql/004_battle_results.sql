-- Phase 9: a finished battle has to be able to say why it ended that way.

-- AlterTable: what separated this placing from the next one.
ALTER TABLE "battle_participants" ADD COLUMN "decidedBy" TEXT;

-- AlterTable: per-case pass/fail and measurements. No inputs and no expected
-- outputs are stored here, so a hidden case stays hidden even to the person
-- whose submission failed it.
ALTER TABLE "judgements" ADD COLUMN "cases" JSONB;
