ALTER TABLE "ai_settings"
ADD COLUMN "remove_opening_signs" BOOLEAN NOT NULL DEFAULT false,
ADD COLUMN "split_long_messages" BOOLEAN NOT NULL DEFAULT false;
