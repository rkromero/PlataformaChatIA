-- AlterTable: add onboarding_completed flag
ALTER TABLE "tenants" ADD COLUMN "onboarding_completed" BOOLEAN NOT NULL DEFAULT false;

-- Mark existing tenants as onboarded (they don't need the wizard)
UPDATE "tenants" SET "onboarding_completed" = true;
