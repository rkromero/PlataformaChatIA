-- Add Google OAuth identifier to tenant users (nullable for backward compatibility)
ALTER TABLE "tenant_users"
ADD COLUMN IF NOT EXISTS "google_id" TEXT;

-- Unique index for Google account linking
CREATE UNIQUE INDEX IF NOT EXISTS "tenant_users_google_id_key"
ON "tenant_users"("google_id");
