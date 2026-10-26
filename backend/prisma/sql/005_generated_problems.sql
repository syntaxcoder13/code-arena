-- Phase 11: problems that were authored rather than hand-written, so the
-- review queue can say where one came from.
ALTER TYPE "ProblemSource" ADD VALUE IF NOT EXISTS 'GENERATED';
