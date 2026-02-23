-- Add name column to tenant_users
ALTER TABLE "tenant_users" ADD COLUMN "name" TEXT NOT NULL DEFAULT '';
