-- Add whatsapp_qr to ChannelType enum
ALTER TYPE "ChannelType" ADD VALUE IF NOT EXISTS 'whatsapp_qr';

-- Add evolution_instance column to tenant_channels
ALTER TABLE "tenant_channels" ADD COLUMN "evolution_instance" TEXT;
