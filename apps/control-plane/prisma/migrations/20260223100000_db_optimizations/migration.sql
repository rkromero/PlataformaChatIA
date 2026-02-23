-- Point 1: Index on tenant_channels[tenant_id, type]
CREATE INDEX IF NOT EXISTS "tenant_channels_tenant_id_type_idx" ON "tenant_channels"("tenant_id", "type");

-- Point 2: Index on tenant_channels[evolution_instance]
CREATE INDEX IF NOT EXISTS "tenant_channels_evolution_instance_idx" ON "tenant_channels"("evolution_instance");

-- Point 3: Index on conversation_links[tenant_id, phone]
CREATE INDEX IF NOT EXISTS "conversation_links_tenant_id_phone_idx" ON "conversation_links"("tenant_id", "phone");

-- Point 4: Index on tenant_users[email] for login queries
CREATE INDEX IF NOT EXISTS "tenant_users_email_idx" ON "tenant_users"("email");

-- Point 5: Remove duplicate index (token column already has @unique constraint)
DROP INDEX IF EXISTS "tokens_token_idx";

-- Point 8: FK on baileys_auth → tenants with CASCADE
ALTER TABLE "baileys_auth" ADD CONSTRAINT "baileys_auth_tenant_id_fkey"
  FOREIGN KEY ("tenant_id") REFERENCES "tenants"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- Point 10: Add updated_at to tenants
ALTER TABLE "tenants" ADD COLUMN "updated_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP;

-- Point 10: Add updated_at to tenant_channels
ALTER TABLE "tenant_channels" ADD COLUMN "updated_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP;

-- Point 12: Autovacuum tuning — baileys_auth (very high churn)
ALTER TABLE "baileys_auth" SET (
  autovacuum_vacuum_scale_factor = 0.05,
  autovacuum_vacuum_threshold = 100,
  autovacuum_analyze_scale_factor = 0.02
);

-- Point 12: Autovacuum tuning — messages (continuous growth)
ALTER TABLE "messages" SET (
  autovacuum_vacuum_scale_factor = 0.1,
  autovacuum_vacuum_threshold = 500
);

-- Point 20: GIN indexes on JSONB columns
CREATE INDEX IF NOT EXISTS "ai_settings_handoff_rules_idx" ON "ai_settings" USING GIN("handoff_rules_json");
CREATE INDEX IF NOT EXISTS "ai_settings_business_hours_idx" ON "ai_settings" USING GIN("business_hours_json");
CREATE INDEX IF NOT EXISTS "whatsapp_templates_components_idx" ON "whatsapp_templates" USING GIN("components");
