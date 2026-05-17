-- CreateTable
CREATE TABLE "DeliverySlotOverride" (
    "id" TEXT NOT NULL,
    "slotId" TEXT NOT NULL,
    "date" DATE NOT NULL,
    "capacity" INTEGER,
    "isActive" BOOLEAN,
    "note" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "DeliverySlotOverride_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "DeliverySlotOverride_date_idx" ON "DeliverySlotOverride"("date");

-- CreateIndex
CREATE UNIQUE INDEX "DeliverySlotOverride_slotId_date_key" ON "DeliverySlotOverride"("slotId", "date");

-- AddForeignKey
ALTER TABLE "DeliverySlotOverride" ADD CONSTRAINT "DeliverySlotOverride_slotId_fkey" FOREIGN KEY ("slotId") REFERENCES "DeliverySlot"("id") ON DELETE CASCADE ON UPDATE CASCADE;
