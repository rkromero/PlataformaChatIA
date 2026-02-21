-- CreateEnum
CREATE TYPE "TokenType" AS ENUM ('password_reset', 'email_verification', 'team_invite');

-- AlterTable: add email_verified to tenant_users
ALTER TABLE "tenant_users" ADD COLUMN "email_verified" BOOLEAN NOT NULL DEFAULT false;

-- Mark existing users as verified
UPDATE "tenant_users" SET "email_verified" = true;

-- CreateTable: tokens
CREATE TABLE "tokens" (
    "id" UUID NOT NULL DEFAULT gen_random_uuid(),
    "email" TEXT NOT NULL,
    "type" "TokenType" NOT NULL,
    "token" TEXT NOT NULL,
    "payload" TEXT,
    "expires_at" TIMESTAMP(3) NOT NULL,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "tokens_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "tokens_token_key" ON "tokens"("token");
CREATE INDEX "tokens_token_idx" ON "tokens"("token");

-- CreateTable: daily_usage
CREATE TABLE "daily_usage" (
    "id" UUID NOT NULL DEFAULT gen_random_uuid(),
    "tenant_id" UUID NOT NULL,
    "date" TEXT NOT NULL,
    "messages" INTEGER NOT NULL DEFAULT 0,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "daily_usage_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "daily_usage_tenant_id_date_key" ON "daily_usage"("tenant_id", "date");

-- AddForeignKey
ALTER TABLE "daily_usage" ADD CONSTRAINT "daily_usage_tenant_id_fkey" FOREIGN KEY ("tenant_id") REFERENCES "tenants"("id") ON DELETE CASCADE ON UPDATE CASCADE;
