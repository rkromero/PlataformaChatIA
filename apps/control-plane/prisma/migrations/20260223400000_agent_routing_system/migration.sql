-- Add assigned_agent_id to conversation_links
ALTER TABLE "conversation_links" ADD COLUMN "assigned_agent_id" UUID;

ALTER TABLE "conversation_links" ADD CONSTRAINT "conversation_links_assigned_agent_id_fkey"
  FOREIGN KEY ("assigned_agent_id") REFERENCES "tenant_users"("id") ON DELETE SET NULL ON UPDATE CASCADE;

CREATE INDEX "conversation_links_tenant_id_assigned_agent_id_idx"
  ON "conversation_links"("tenant_id", "assigned_agent_id");

-- Create routing_rules enum and table
CREATE TYPE "RoutingRuleType" AS ENUM ('round_robin', 'fixed', 'geo');

CREATE TABLE "routing_rules" (
  "id"                UUID NOT NULL DEFAULT gen_random_uuid(),
  "tenant_id"         UUID NOT NULL,
  "name"              TEXT NOT NULL,
  "type"              "RoutingRuleType" NOT NULL,
  "conditions_json"   JSONB NOT NULL DEFAULT '{}',
  "assigned_agent_id" UUID,
  "priority"          INTEGER NOT NULL DEFAULT 0,
  "is_active"         BOOLEAN NOT NULL DEFAULT true,
  "round_robin_index" INTEGER NOT NULL DEFAULT 0,
  "created_at"        TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updated_at"        TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

  CONSTRAINT "routing_rules_pkey" PRIMARY KEY ("id")
);

ALTER TABLE "routing_rules" ADD CONSTRAINT "routing_rules_tenant_id_fkey"
  FOREIGN KEY ("tenant_id") REFERENCES "tenants"("id") ON DELETE CASCADE ON UPDATE CASCADE;

ALTER TABLE "routing_rules" ADD CONSTRAINT "routing_rules_assigned_agent_id_fkey"
  FOREIGN KEY ("assigned_agent_id") REFERENCES "tenant_users"("id") ON DELETE SET NULL ON UPDATE CASCADE;

CREATE INDEX "routing_rules_tenant_id_is_active_priority_idx"
  ON "routing_rules"("tenant_id", "is_active", "priority");
