import { db } from "@/lib/db";
import { getOverridesInRange } from "@/server/services/slot-override.service";
import type { Prisma } from "@prisma/client";
import { getPickupAvailability, occupyingPickupOrders } from "@/server/services/pickup-availability.service";
import { addPickupDays, pickupDateKey, pickupDateColumn, pickupDayBounds } from "@/lib/pickup-schedule";

export async function validateDeliverySlot(
  slotId: string, date: Date, storeId: string,
  options: { client?: Prisma.TransactionClient; cutoffHour?: number } = {},
) {
  const key = pickupDateKey(date);
  const availability = await getPickupAvailability(storeId, key, key, options);
  const slot = availability.days[0]?.slots.find((item) => item.id === slotId);
  if (!slot) throw new Error("Slot pickup tidak tersedia untuk toko yang dipilih.");
  if (slot.status === "past") throw new Error("Tanggal atau jam pickup sudah lewat. Pilih jadwal lain.");
  if (slot.status === "cutoff") throw new Error(`Batas pickup hari ini (${availability.cutoffHour}.00 WITA) sudah lewat. Pilih tanggal berikutnya.`);
  if (slot.status === "closed") throw new Error("Slot pickup tutup pada tanggal ini. Pilih jadwal lain.");
  if (slot.status === "full") throw new Error("Slot pickup baru saja penuh. Pilih jam atau tanggal lain.");
  return slot;
}

export async function listAllDeliverySlots() {
  return db.deliverySlot.findMany({
    orderBy: [{ storeId: "asc" }, { startTime: "asc" }],
    include: { store: { select: { id: true, name: true } } },
  });
}

export type SlotUtilization = {
  slotId: string;
  label: string;
  capacity: number;
  isActive: boolean;
  days: {
    date: string;
    booked: number;
    capacity: number;
    isActive: boolean;
    isOverridden: boolean;
    note: string | null;
    overrideCapacity: number | null;
    overrideIsActive: boolean | null;
  }[];
};

function isoDate(d: Date) {
  return d.toISOString().slice(0, 10);
}

export async function computeSlotUtilization(
  options: { from?: Date; to?: Date; days?: number } = {},
): Promise<SlotUtilization[]> {
  const now = new Date();
  const fromKey = pickupDateKey(options.from ?? now);
  const toKey = options.to ? pickupDateKey(options.to) : addPickupDays(fromKey, (options.days ?? 14) - 1);
  const from = pickupDateColumn(fromKey);
  const to = pickupDateColumn(toKey);

  const totalDays =
    Math.round((to.getTime() - from.getTime()) / (24 * 60 * 60 * 1000)) + 1;

  const [slots, orders, overrides] = await Promise.all([
    db.deliverySlot.findMany({ orderBy: { startTime: "asc" } }),
    db.order.findMany({
      where: {
        deliveryDate: { gte: pickupDayBounds(fromKey).start, lt: pickupDayBounds(toKey).end },
        ...occupyingPickupOrders(now),
      },
      select: { deliverySlotId: true, deliveryDate: true },
    }),
    getOverridesInRange(from, to),
  ]);

  const counts = new Map<string, number>();
  for (const order of orders) {
    const day = pickupDateKey(order.deliveryDate);
    counts.set(`${order.deliverySlotId}|${day}`, (counts.get(`${order.deliverySlotId}|${day}`) ?? 0) + 1);
  }

  const overrideMap = new Map<string, (typeof overrides)[number]>();
  for (const ov of overrides) {
    overrideMap.set(`${ov.slotId}|${isoDate(ov.date)}`, ov);
  }

  return slots.map((slot) => {
    const dayRows: SlotUtilization["days"] = [];
    for (let i = 0; i < totalDays; i++) {
      const dayKey = addPickupDays(fromKey, i);
      const ov = overrideMap.get(`${slot.id}|${dayKey}`);
      dayRows.push({
        date: dayKey,
        booked: counts.get(`${slot.id}|${dayKey}`) ?? 0,
        capacity: ov?.capacity ?? slot.capacity,
        isActive: ov?.isActive ?? slot.isActive,
        isOverridden: !!ov,
        note: ov?.note ?? null,
        overrideCapacity: ov?.capacity ?? null,
        overrideIsActive: ov?.isActive ?? null,
      });
    }
    return {
      slotId: slot.id,
      label: slot.label,
      capacity: slot.capacity,
      isActive: slot.isActive,
      days: dayRows,
    };
  });
}
