ALTER TABLE "messages"
ADD COLUMN "agent_user_id" UUID;

CREATE INDEX "messages_tenant_id_agent_user_id_timestamp_idx"
ON "messages"("tenant_id", "agent_user_id", "timestamp");
