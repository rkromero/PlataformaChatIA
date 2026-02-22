-- CreateEnum
CREATE TYPE "LeadStage" AS ENUM ('new', 'contacted', 'qualified', 'proposal', 'won', 'lost');

-- AlterTable: add CRM fields to conversation_links
ALTER TABLE "conversation_links" ADD COLUMN "contact_name" TEXT;
ALTER TABLE "conversation_links" ADD COLUMN "last_message" TEXT;
ALTER TABLE "conversation_links" ADD COLUMN "stage" "LeadStage" NOT NULL DEFAULT 'new';
ALTER TABLE "conversation_links" ADD COLUMN "notes" TEXT;
ALTER TABLE "conversation_links" ADD COLUMN "updated_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP;

-- CreateIndex
CREATE INDEX "conversation_links_tenant_id_stage_idx" ON "conversation_links"("tenant_id", "stage");
