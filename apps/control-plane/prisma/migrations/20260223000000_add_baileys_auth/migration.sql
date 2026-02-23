-- CreateTable
CREATE TABLE "baileys_auth" (
    "id" UUID NOT NULL DEFAULT gen_random_uuid(),
    "tenant_id" UUID NOT NULL,
    "data_key" TEXT NOT NULL,
    "data_val" TEXT NOT NULL,

    CONSTRAINT "baileys_auth_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "baileys_auth_tenant_id_data_key_key" ON "baileys_auth"("tenant_id", "data_key");
