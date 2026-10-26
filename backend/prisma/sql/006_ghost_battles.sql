-- Phase 13: one player against a stored submission, so there is always
-- something to play.

-- A ghost participant is a copy of somebody's past submission, not a person.
-- The user it belongs to never sees the battle, so their own battle list has
-- to be able to leave these out.
ALTER TABLE "battle_participants" ADD COLUMN "isGhost" BOOLEAN NOT NULL DEFAULT false;

-- AlterEnum
ALTER TYPE "BattleVisibility" ADD VALUE IF NOT EXISTS 'GHOST';
