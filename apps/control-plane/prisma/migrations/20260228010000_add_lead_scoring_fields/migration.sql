ALTER TABLE "ai_settings"
ADD COLUMN "lead_scoring_enabled" BOOLEAN NOT NULL DEFAULT false;

ALTER TABLE "conversation_links"
ADD COLUMN "lead_score" INTEGER NOT NULL DEFAULT 0,
ADD COLUMN "lead_temperature" TEXT NOT NULL DEFAULT 'cold';

CREATE INDEX "conversation_links_tenant_id_lead_score_idx"
ON "conversation_links"("tenant_id", "lead_score");
