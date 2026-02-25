-- Add modules_json to tenants
ALTER TABLE "tenants" ADD COLUMN "modules_json" JSONB NOT NULL DEFAULT '{}';

-- Calendar enums
CREATE TYPE "AppointmentStatus" AS ENUM ('pending', 'confirmed', 'cancelled', 'completed', 'no_show');
CREATE TYPE "AppointmentSource" AS ENUM ('chat_ai', 'manual', 'web');

-- Calendar config (per-tenant settings)
CREATE TABLE "calendar_config" (
    "tenant_id" UUID NOT NULL,
    "timezone" TEXT NOT NULL DEFAULT 'America/Argentina/Buenos_Aires',
    "slot_buffer_minutes" INTEGER NOT NULL DEFAULT 15,
    "min_advance_hours" INTEGER NOT NULL DEFAULT 2,
    "max_advance_days" INTEGER NOT NULL DEFAULT 30,
    "updated_at" TIMESTAMP(3) NOT NULL,
    CONSTRAINT "calendar_config_pkey" PRIMARY KEY ("tenant_id")
);

-- Calendar services
CREATE TABLE "calendar_services" (
    "id" UUID NOT NULL DEFAULT gen_random_uuid(),
    "tenant_id" UUID NOT NULL,
    "name" TEXT NOT NULL,
    "duration_minutes" INTEGER NOT NULL,
    "price" DECIMAL(10,2),
    "color" TEXT NOT NULL DEFAULT '#6366f1',
    "is_active" BOOLEAN NOT NULL DEFAULT true,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,
    CONSTRAINT "calendar_services_pkey" PRIMARY KEY ("id")
);

-- Professional-service link (N:N between tenant_users and calendar_services)
CREATE TABLE "calendar_professional_services" (
    "id" UUID NOT NULL DEFAULT gen_random_uuid(),
    "professional_id" UUID NOT NULL,
    "service_id" UUID NOT NULL,
    CONSTRAINT "calendar_professional_services_pkey" PRIMARY KEY ("id")
);

-- Professional schedules (working hours per day)
CREATE TABLE "calendar_schedules" (
    "id" UUID NOT NULL DEFAULT gen_random_uuid(),
    "professional_id" UUID NOT NULL,
    "day_of_week" INTEGER NOT NULL,
    "start_time" TEXT NOT NULL,
    "end_time" TEXT NOT NULL,
    "break_start" TEXT,
    "break_end" TEXT,
    CONSTRAINT "calendar_schedules_pkey" PRIMARY KEY ("id")
);

-- Blocked times (vacations, breaks, etc.)
CREATE TABLE "calendar_blocked_times" (
    "id" UUID NOT NULL DEFAULT gen_random_uuid(),
    "professional_id" UUID NOT NULL,
    "start_at" TIMESTAMP(3) NOT NULL,
    "end_at" TIMESTAMP(3) NOT NULL,
    "reason" TEXT,
    CONSTRAINT "calendar_blocked_times_pkey" PRIMARY KEY ("id")
);

-- Appointments
CREATE TABLE "appointments" (
    "id" UUID NOT NULL DEFAULT gen_random_uuid(),
    "tenant_id" UUID NOT NULL,
    "service_id" UUID NOT NULL,
    "professional_id" UUID NOT NULL,
    "conversation_link_id" UUID,
    "client_name" TEXT NOT NULL,
    "client_phone" TEXT,
    "start_at" TIMESTAMP(3) NOT NULL,
    "end_at" TIMESTAMP(3) NOT NULL,
    "status" "AppointmentStatus" NOT NULL DEFAULT 'pending',
    "source" "AppointmentSource" NOT NULL DEFAULT 'manual',
    "notes" TEXT,
    "reminder_sent_at" TIMESTAMP(3),
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,
    CONSTRAINT "appointments_pkey" PRIMARY KEY ("id")
);

-- Indexes
CREATE INDEX "calendar_services_tenant_id_is_active_idx" ON "calendar_services"("tenant_id", "is_active");
CREATE UNIQUE INDEX "calendar_professional_services_professional_id_service_id_key" ON "calendar_professional_services"("professional_id", "service_id");
CREATE UNIQUE INDEX "calendar_schedules_professional_id_day_of_week_key" ON "calendar_schedules"("professional_id", "day_of_week");
CREATE INDEX "calendar_blocked_times_professional_id_start_at_end_at_idx" ON "calendar_blocked_times"("professional_id", "start_at", "end_at");
CREATE INDEX "appointments_tenant_id_start_at_idx" ON "appointments"("tenant_id", "start_at");
CREATE INDEX "appointments_professional_id_start_at_idx" ON "appointments"("professional_id", "start_at");
CREATE INDEX "appointments_tenant_id_status_idx" ON "appointments"("tenant_id", "status");

-- Foreign keys
ALTER TABLE "calendar_config" ADD CONSTRAINT "calendar_config_tenant_id_fkey" FOREIGN KEY ("tenant_id") REFERENCES "tenants"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "calendar_services" ADD CONSTRAINT "calendar_services_tenant_id_fkey" FOREIGN KEY ("tenant_id") REFERENCES "tenants"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "calendar_professional_services" ADD CONSTRAINT "calendar_professional_services_professional_id_fkey" FOREIGN KEY ("professional_id") REFERENCES "tenant_users"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "calendar_professional_services" ADD CONSTRAINT "calendar_professional_services_service_id_fkey" FOREIGN KEY ("service_id") REFERENCES "calendar_services"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "calendar_schedules" ADD CONSTRAINT "calendar_schedules_professional_id_fkey" FOREIGN KEY ("professional_id") REFERENCES "tenant_users"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "calendar_blocked_times" ADD CONSTRAINT "calendar_blocked_times_professional_id_fkey" FOREIGN KEY ("professional_id") REFERENCES "tenant_users"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "appointments" ADD CONSTRAINT "appointments_tenant_id_fkey" FOREIGN KEY ("tenant_id") REFERENCES "tenants"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "appointments" ADD CONSTRAINT "appointments_service_id_fkey" FOREIGN KEY ("service_id") REFERENCES "calendar_services"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "appointments" ADD CONSTRAINT "appointments_professional_id_fkey" FOREIGN KEY ("professional_id") REFERENCES "tenant_users"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "appointments" ADD CONSTRAINT "appointments_conversation_link_id_fkey" FOREIGN KEY ("conversation_link_id") REFERENCES "conversation_links"("id") ON DELETE SET NULL ON UPDATE CASCADE;
