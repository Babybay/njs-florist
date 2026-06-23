-- AlterTable
ALTER TABLE "DeliverySlot" ADD COLUMN     "storeId" TEXT;

-- AlterTable
ALTER TABLE "Order" ADD COLUMN     "storeId" TEXT;

-- CreateTable
CREATE TABLE "Store" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "address" TEXT NOT NULL,
    "phone" TEXT,
    "mapsUrl" TEXT,
    "sortOrder" INTEGER NOT NULL DEFAULT 0,
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Store_pkey" PRIMARY KEY ("id")
);

-- Seed two stores. Store 1 inherits the current pickup_address setting if present.
INSERT INTO "Store" ("id", "name", "address", "sortOrder", "isActive", "createdAt", "updatedAt")
VALUES (
    'store_seed_1',
    'njs Florist — Store 1',
    COALESCE((SELECT "value" FROM "AppSetting" WHERE "key" = 'pickup_address'), 'Jl. Sunset Road No. 88, Kuta, Bali'),
    0, true, now(), now()
);

INSERT INTO "Store" ("id", "name", "address", "sortOrder", "isActive", "createdAt", "updatedAt")
VALUES (
    'store_seed_2',
    'njs Florist — Store 2',
    'Alamat toko kedua — ubah di Pengaturan',
    1, true, now(), now()
);

-- Backfill every existing order to Store 1.
UPDATE "Order" SET "storeId" = 'store_seed_1' WHERE "storeId" IS NULL;

-- Backfill every existing delivery slot to Store 1 (Store 1 keeps the current schedule).
UPDATE "DeliverySlot" SET "storeId" = 'store_seed_1' WHERE "storeId" IS NULL;

-- CreateIndex
CREATE INDEX "DeliverySlot_storeId_idx" ON "DeliverySlot"("storeId");

-- CreateIndex
CREATE INDEX "Order_storeId_status_idx" ON "Order"("storeId", "status");

-- AddForeignKey
ALTER TABLE "Order" ADD CONSTRAINT "Order_storeId_fkey" FOREIGN KEY ("storeId") REFERENCES "Store"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "DeliverySlot" ADD CONSTRAINT "DeliverySlot_storeId_fkey" FOREIGN KEY ("storeId") REFERENCES "Store"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- Enforce NOT NULL now that every row has been backfilled.
ALTER TABLE "Order" ALTER COLUMN "storeId" SET NOT NULL;
ALTER TABLE "DeliverySlot" ALTER COLUMN "storeId" SET NOT NULL;
