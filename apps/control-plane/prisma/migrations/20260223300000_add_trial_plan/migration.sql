-- Add trial to TenantPlan enum
ALTER TYPE "TenantPlan" ADD VALUE IF NOT EXISTS 'trial' BEFORE 'starter';

-- Add trial_ends_at column to tenants
ALTER TABLE "tenants" ADD COLUMN "trial_ends_at" TIMESTAMP(3);
