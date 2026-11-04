import { db } from "@/lib/db";
import { pickupDateColumn } from "@/lib/pickup-schedule";
import type { PrismaClient } from "@prisma/client";

export async function setStoreDayAvailability(storeId: string, dateKey: string, mode: "close" | "open" | "reset", client: Pick<PrismaClient, "$transaction"> = db) {
  const date = pickupDateColumn(dateKey);
  return client.$transaction(async (tx) => {
    const slots = await tx.deliverySlot.findMany({ where: { storeId }, orderBy: { id: "asc" }, select: { id: true } });
    if (!slots.length) throw new Error("Toko ini belum memiliki slot pickup.");
    // Same lock as checkout. Sorted acquisition avoids deadlocks across bulk edits.
    for (const slot of slots) await tx.$executeRaw`SELECT pg_advisory_xact_lock(hashtext(${`pickup:${slot.id}:${dateKey}`}))`;
    if (mode === "reset") {
      await tx.deliverySlotOverride.deleteMany({ where: { slotId: { in: slots.map((slot) => slot.id) }, date } });
    } else {
      for (const slot of slots) await tx.deliverySlotOverride.upsert({
        where: { slotId_date: { slotId: slot.id, date } },
        create: { slotId: slot.id, date, isActive: mode === "open" },
        update: { isActive: mode === "open" },
      });
    }
    return { updated: slots.length };
  }, { timeout: 30_000 });
}
