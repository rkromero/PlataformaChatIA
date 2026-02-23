-- ============================================================
-- Point 6: DailyUsage.date  String → DATE
-- ============================================================
DROP INDEX IF EXISTS "daily_usage_tenant_id_date_key";
ALTER TABLE "daily_usage" ALTER COLUMN "date" TYPE DATE USING "date"::DATE;
CREATE UNIQUE INDEX "daily_usage_tenant_id_date_key" ON "daily_usage"("tenant_id", "date");

-- ============================================================
-- Point 7: Message.direction  String → enum
-- ============================================================
UPDATE "messages" SET "direction" = 'incoming'
  WHERE "direction" NOT IN ('incoming', 'outgoing');

CREATE TYPE "MessageDirection" AS ENUM ('incoming', 'outgoing');
ALTER TABLE "messages"
  ALTER COLUMN "direction" TYPE "MessageDirection"
  USING "direction"::"MessageDirection";

-- ============================================================
-- Point 9: FK Message.tenantId → Tenant (cascade)
-- ============================================================
DELETE FROM "messages"
  WHERE "tenant_id" NOT IN (SELECT "id" FROM "tenants");

ALTER TABLE "messages" ADD CONSTRAINT "messages_tenant_id_fkey"
  FOREIGN KEY ("tenant_id")
  REFERENCES "tenants"("id")
  ON DELETE CASCADE ON UPDATE CASCADE;

-- ============================================================
-- Point 11: BRIN index on messages.timestamp
-- ============================================================
CREATE INDEX IF NOT EXISTS "messages_timestamp_brin"
  ON "messages" USING BRIN("timestamp");

-- ============================================================
-- Point 13: Full-text search for Knowledge Base (trigger-based)
-- ============================================================
ALTER TABLE "knowledge_entries"
  ADD COLUMN IF NOT EXISTS "search_vector" tsvector;

CREATE OR REPLACE FUNCTION knowledge_entries_search_trigger()
RETURNS trigger AS $$
BEGIN
  NEW.search_vector :=
    setweight(to_tsvector('spanish', coalesce(NEW.title, '')), 'A') ||
    setweight(to_tsvector('spanish', coalesce(NEW.content, '')), 'B');
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS trig_knowledge_search ON "knowledge_entries";
CREATE TRIGGER trig_knowledge_search
  BEFORE INSERT OR UPDATE OF title, content ON "knowledge_entries"
  FOR EACH ROW EXECUTE FUNCTION knowledge_entries_search_trigger();

UPDATE "knowledge_entries" SET search_vector =
  setweight(to_tsvector('spanish', coalesce(title, '')), 'A') ||
  setweight(to_tsvector('spanish', coalesce(content, '')), 'B');

CREATE INDEX IF NOT EXISTS "knowledge_entries_search_idx"
  ON "knowledge_entries" USING GIN("search_vector");

-- ============================================================
-- Point 18: Add source field to conversation_links
-- ============================================================
CREATE TYPE "ConversationSource" AS ENUM ('chatwoot', 'whatsapp_qr', 'manual');

ALTER TABLE "conversation_links"
  ADD COLUMN "source" "ConversationSource" NOT NULL DEFAULT 'chatwoot';

UPDATE "conversation_links"
  SET "source" = 'whatsapp_qr'
  WHERE "chatwoot_conversation_id" < 0 AND "waha_chat_id" IS NOT NULL;

UPDATE "conversation_links"
  SET "source" = 'manual'
  WHERE "chatwoot_conversation_id" < 0 AND "waha_chat_id" IS NULL;

CREATE INDEX "conversation_links_source_idx"
  ON "conversation_links"("tenant_id", "source");

-- ============================================================
-- Point 19: Soft deletes
-- ============================================================
ALTER TABLE "tenants"            ADD COLUMN "deleted_at" TIMESTAMP(3);
ALTER TABLE "tenant_users"       ADD COLUMN "deleted_at" TIMESTAMP(3);
ALTER TABLE "conversation_links" ADD COLUMN "deleted_at" TIMESTAMP(3);
ALTER TABLE "tenant_channels"    ADD COLUMN "deleted_at" TIMESTAMP(3);
ALTER TABLE "knowledge_entries"  ADD COLUMN "deleted_at" TIMESTAMP(3);
ALTER TABLE "whatsapp_templates" ADD COLUMN "deleted_at" TIMESTAMP(3);

CREATE INDEX "tenants_not_deleted_idx"
  ON "tenants"("id") WHERE "deleted_at" IS NULL;
CREATE INDEX "tenant_users_not_deleted_idx"
  ON "tenant_users"("tenant_id") WHERE "deleted_at" IS NULL;
CREATE INDEX "conversation_links_not_deleted_idx"
  ON "conversation_links"("tenant_id") WHERE "deleted_at" IS NULL;
CREATE INDEX "tenant_channels_not_deleted_idx"
  ON "tenant_channels"("tenant_id") WHERE "deleted_at" IS NULL;
CREATE INDEX "knowledge_entries_not_deleted_idx"
  ON "knowledge_entries"("tenant_id") WHERE "deleted_at" IS NULL;
