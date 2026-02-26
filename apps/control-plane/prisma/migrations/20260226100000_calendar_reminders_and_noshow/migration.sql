-- Add configurable reminder times to calendar_config
ALTER TABLE "calendar_config" ADD COLUMN "reminder_minutes_1" INTEGER NOT NULL DEFAULT 60;
ALTER TABLE "calendar_config" ADD COLUMN "reminder_minutes_2" INTEGER;

-- Add second reminder tracking to appointments
ALTER TABLE "appointments" ADD COLUMN "reminder2_sent_at" TIMESTAMP(3);
