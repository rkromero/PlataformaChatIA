-- CreateEnum
CREATE TYPE "TenantStatus" AS ENUM ('active', 'paused');

-- CreateEnum
CREATE TYPE "TenantPlan" AS ENUM ('starter', 'pro', 'enterprise');

-- CreateEnum
CREATE TYPE "UserRole" AS ENUM ('owner', 'admin', 'agent');

-- CreateEnum
CREATE TYPE "ChannelType" AS ENUM ('whatsapp', 'webchat');

-- CreateTable
CREATE TABLE "tenants" (
    "id" UUID NOT NULL,
    "name" TEXT NOT NULL,
    "status" "TenantStatus" NOT NULL DEFAULT 'active',
    "plan" "TenantPlan" NOT NULL DEFAULT 'starter',
    "chatwoot_account_id" INTEGER NOT NULL,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "tenants_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "tenant_users" (
    "id" UUID NOT NULL,
    "tenant_id" UUID NOT NULL,
    "email" TEXT NOT NULL,
    "password_hash" TEXT NOT NULL,
    "role" "UserRole" NOT NULL DEFAULT 'agent',
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "tenant_users_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "ai_settings" (
    "tenant_id" UUID NOT NULL,
    "enabled" BOOLEAN NOT NULL DEFAULT true,
    "model" TEXT NOT NULL DEFAULT 'gpt-4.1-mini',
    "system_prompt" TEXT NOT NULL DEFAULT 'Eres un asistente de atención al cliente. Responde de forma breve y útil en español.',
    "handoff_rules_json" JSONB NOT NULL DEFAULT '{"keywords":["humano","asesor","agente","persona"],"handoffTag":"human_handoff"}',
    "business_hours_json" JSONB,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "ai_settings_pkey" PRIMARY KEY ("tenant_id")
);

-- CreateTable
CREATE TABLE "tenant_channels" (
    "id" UUID NOT NULL,
    "tenant_id" UUID NOT NULL,
    "type" "ChannelType" NOT NULL DEFAULT 'whatsapp',
    "chatwoot_inbox_id" INTEGER NOT NULL,
    "config_encrypted_json" TEXT NOT NULL,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "tenant_channels_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "conversation_links" (
    "id" UUID NOT NULL,
    "tenant_id" UUID NOT NULL,
    "chatwoot_conversation_id" INTEGER NOT NULL,
    "chatwoot_contact_id" INTEGER,
    "phone" TEXT,
    "crm_lead_id" TEXT,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "conversation_links_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "tenants_chatwoot_account_id_key" ON "tenants"("chatwoot_account_id");

-- CreateIndex
CREATE UNIQUE INDEX "tenant_users_tenant_id_email_key" ON "tenant_users"("tenant_id", "email");

-- CreateIndex
CREATE UNIQUE INDEX "conversation_links_tenant_id_chatwoot_conversation_id_key" ON "conversation_links"("tenant_id", "chatwoot_conversation_id");

-- AddForeignKey
ALTER TABLE "tenant_users" ADD CONSTRAINT "tenant_users_tenant_id_fkey" FOREIGN KEY ("tenant_id") REFERENCES "tenants"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ai_settings" ADD CONSTRAINT "ai_settings_tenant_id_fkey" FOREIGN KEY ("tenant_id") REFERENCES "tenants"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "tenant_channels" ADD CONSTRAINT "tenant_channels_tenant_id_fkey" FOREIGN KEY ("tenant_id") REFERENCES "tenants"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "conversation_links" ADD CONSTRAINT "conversation_links_tenant_id_fkey" FOREIGN KEY ("tenant_id") REFERENCES "tenants"("id") ON DELETE CASCADE ON UPDATE CASCADE;
