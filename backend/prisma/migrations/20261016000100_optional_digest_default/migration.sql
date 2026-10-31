-- Optional digest email is off for newly created preferences.
-- Existing accounts keep their previously stored preference.
ALTER TABLE "user_preferences" ALTER COLUMN "emailDigest" SET DEFAULT false;
