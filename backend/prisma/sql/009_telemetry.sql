-- Phase 14: how the code arrived in the editor.
--
-- Timing and sizes only. No content is stored here, from inside the editor or
-- outside it, and the shape is asserted on the way in rather than trusted:
-- see `TELEMETRY_FIELDS` in the submission DTO.
--
-- One JSON column rather than a dozen integers because these counters are
-- read as a set by a person, never queried or aggregated over, and adding a
-- signal later should not need a migration on a table this size.
ALTER TABLE "submissions" ADD COLUMN "telemetry" JSONB;
