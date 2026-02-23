-- AlterTable: add WAHA fields to conversation_links
ALTER TABLE "conversation_links" ADD COLUMN "waha_chat_id" TEXT;
ALTER TABLE "conversation_links" ADD COLUMN "handoff_active" BOOLEAN NOT NULL DEFAULT false;

-- CreateTable: messages
CREATE TABLE "messages" (
    "id" UUID NOT NULL DEFAULT gen_random_uuid(),
    "tenant_id" UUID NOT NULL,
    "conversation_link_id" UUID NOT NULL,
    "direction" TEXT NOT NULL,
    "content" TEXT NOT NULL,
    "sender_name" TEXT,
    "timestamp" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "messages_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "messages_conversation_link_id_timestamp_idx" ON "messages"("conversation_link_id", "timestamp");

-- AddForeignKey
ALTER TABLE "messages" ADD CONSTRAINT "messages_conversation_link_id_fkey" FOREIGN KEY ("conversation_link_id") REFERENCES "conversation_links"("id") ON DELETE CASCADE ON UPDATE CASCADE;
