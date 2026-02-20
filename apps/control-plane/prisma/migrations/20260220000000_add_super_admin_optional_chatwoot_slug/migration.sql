-- AlterEnum: add super_admin to UserRole
ALTER TYPE "UserRole" ADD VALUE 'super_admin';

-- AlterTable: make chatwoot_account_id optional and add slug
ALTER TABLE "tenants" ALTER COLUMN "chatwoot_account_id" DROP NOT NULL;
ALTER TABLE "tenants" ADD COLUMN "slug" TEXT;

-- CreateIndex
CREATE UNIQUE INDEX "tenants_slug_key" ON "tenants"("slug");
