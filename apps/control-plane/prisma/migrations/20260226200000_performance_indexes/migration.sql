-- Performance indexes migration

-- Messages: tenant-scoped queries
CREATE INDEX "messages_tenant_id_idx" ON "messages"("tenant_id");

-- Appointments: no-show detector (status + endAt)
CREATE INDEX "appointments_status_end_at_idx" ON "appointments"("status", "end_at");

-- BaileysAuth: reconnect lookup by tenant
CREATE INDEX "baileys_auth_tenant_id_idx" ON "baileys_auth"("tenant_id");

-- Tokens: expiry cleanup
CREATE INDEX "tokens_expires_at_idx" ON "tokens"("expires_at");

-- CalendarProfessionalService: service-based lookups
CREATE INDEX "calendar_professional_services_service_id_idx" ON "calendar_professional_services"("service_id");

-- WhatsAppTemplate: tenant + soft-delete filter
CREATE INDEX "whatsapp_templates_tenant_id_deleted_at_idx" ON "whatsapp_templates"("tenant_id", "deleted_at");

-- GIN index on tenants.modules_json for JSONB containment queries
CREATE INDEX "tenants_modules_json_gin_idx" ON "tenants" USING GIN ("modules_json");

-- Partial index: upcoming non-cancelled appointments (hot query path)
CREATE INDEX "appointments_upcoming_idx" ON "appointments"("tenant_id", "start_at")
  WHERE "status" NOT IN ('cancelled', 'completed', 'no_show');

-- Partial index: pending reminders (cron job optimization)
CREATE INDEX "appointments_reminder1_pending_idx" ON "appointments"("tenant_id", "start_at")
  WHERE "reminder_sent_at" IS NULL AND "status" IN ('pending', 'confirmed');

CREATE INDEX "appointments_reminder2_pending_idx" ON "appointments"("tenant_id", "start_at")
  WHERE "reminder2_sent_at" IS NULL AND "status" IN ('pending', 'confirmed');
