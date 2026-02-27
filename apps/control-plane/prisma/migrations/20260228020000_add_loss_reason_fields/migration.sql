ALTER TABLE "conversation_links"
ADD COLUMN "loss_reason" TEXT,
ADD COLUMN "loss_reason_detail" TEXT,
ADD COLUMN "lost_at" TIMESTAMP(3);

CREATE INDEX "conversation_links_tenant_id_stage_loss_reason_idx"
ON "conversation_links"("tenant_id", "stage", "loss_reason");
