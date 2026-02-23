-- Add tags array to conversation_links
ALTER TABLE "conversation_links" ADD COLUMN "tags" TEXT[] NOT NULL DEFAULT '{}';

-- Create lead_tasks table
CREATE TABLE "lead_tasks" (
    "id" UUID NOT NULL DEFAULT gen_random_uuid(),
    "tenant_id" UUID NOT NULL,
    "conversation_link_id" UUID NOT NULL,
    "title" TEXT NOT NULL,
    "due_date" TIMESTAMP(3),
    "completed" BOOLEAN NOT NULL DEFAULT false,
    "completed_at" TIMESTAMP(3),
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "lead_tasks_pkey" PRIMARY KEY ("id")
);

CREATE INDEX "lead_tasks_conversation_link_id_completed_idx" ON "lead_tasks"("conversation_link_id", "completed");
CREATE INDEX "lead_tasks_tenant_id_due_date_idx" ON "lead_tasks"("tenant_id", "due_date");

ALTER TABLE "lead_tasks" ADD CONSTRAINT "lead_tasks_tenant_id_fkey" FOREIGN KEY ("tenant_id") REFERENCES "tenants"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "lead_tasks" ADD CONSTRAINT "lead_tasks_conversation_link_id_fkey" FOREIGN KEY ("conversation_link_id") REFERENCES "conversation_links"("id") ON DELETE CASCADE ON UPDATE CASCADE;
