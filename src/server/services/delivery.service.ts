import { db } from "@/lib/db";
import { endOfDay, isSameCalendarDay, startOfDay } from "@/lib/utils";
import { getSettingNumber, SETTING_KEYS } from "@/server/services/settings.service";
import { getOverridesInRange } from "@/server/services/slot-override.service";

const OCCUPYING_STATUSES = [
  "PAID",
  "PREPARING",
  "READY_FOR_DELIVERY",
  "OUT_FOR_DELIVERY",
  "DELIVERED",
  "COMPLETED",
] as const;

function dateOnly(d: Date) {
  return new Date(Date.UTC(d.getFullYear(), d.getMonth(), d.getDate()));
}

export async function validateDeliverySlot(slotId: string, date: Date, storeId: string) {
  const slot = await db.deliverySlot.findUnique({ where: { id: slotId } });
  if (!slot) throw new Error("Delivery slot is not available.");
  if (slot.storeId !== storeId) {
    throw new Error("Slot pickup tidak tersedia untuk toko yang dipilih.");
  }

  const override = await db.deliverySlotOverride.findUnique({
    where: { slotId_date: { slotId, date: dateOnly(date) } },
  });

  const effectiveActive = override?.isActive ?? slot.isActive;
  const effectiveCapacity = override?.capacity ?? slot.capacity;

  if (!effectiveActive) {
    throw new Error("Delivery slot is not available on this date.");
  }

  const now = new Date();
  if (date < startOfDay(now)) {
    throw new Error("Delivery date cannot be in the past.");
  }

  const cutoffHour = await getSettingNumber(SETTING_KEYS.SAME_DAY_CUTOFF_HOUR);
  if (isSameCalendarDay(date, now) && now.getHours() >= cutoffHour) {
    throw new Error(`Same-day delivery cutoff (${cutoffHour}:00) has passed.`);
  }

  const occupied = await db.order.count({
    where: {
      deliverySlotId: slotId,
      deliveryDate: { gte: startOfDay(date), lte: endOfDay(date) },
      status: { in: [...OCCUPYING_STATUSES] },
    },
  });

  if (occupied >= effectiveCapacity) {
    throw new Error("Delivery slot is fully booked.");
  }

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
  }[];
};

function isoDate(d: Date) {
  return d.toISOString().slice(0, 10);
}

export async function computeSlotUtilization(
  options: { from?: Date; to?: Date; days?: number } = {},
): Promise<SlotUtilization[]> {
  const from = options.from ? startOfDay(options.from) : startOfDay(new Date());
  const to = options.to
    ? startOfDay(options.to)
    : (() => {
        const d = new Date(from);
        d.setDate(d.getDate() + (options.days ?? 14) - 1);
        return d;
      })();

  const exclusiveEnd = new Date(to);
  exclusiveEnd.setDate(exclusiveEnd.getDate() + 1);

  const totalDays =
    Math.round((to.getTime() - from.getTime()) / (24 * 60 * 60 * 1000)) + 1;

  const [slots, orders, overrides] = await Promise.all([
    db.deliverySlot.findMany({ orderBy: { startTime: "asc" } }),
    db.order.findMany({
      where: {
        deliveryDate: { gte: from, lt: exclusiveEnd },
        status: { in: [...OCCUPYING_STATUSES] },
      },
      select: { deliverySlotId: true, deliveryDate: true },
    }),
    getOverridesInRange(from, to),
  ]);

  const counts = new Map<string, number>();
  for (const order of orders) {
    const day = isoDate(startOfDay(order.deliveryDate));
    counts.set(`${order.deliverySlotId}|${day}`, (counts.get(`${order.deliverySlotId}|${day}`) ?? 0) + 1);
  }

  const overrideMap = new Map<string, (typeof overrides)[number]>();
  for (const ov of overrides) {
    overrideMap.set(`${ov.slotId}|${isoDate(ov.date)}`, ov);
  }

  return slots.map((slot) => {
    const dayRows: SlotUtilization["days"] = [];
    for (let i = 0; i < totalDays; i++) {
      const d = new Date(from);
      d.setDate(d.getDate() + i);
      const dayKey = isoDate(d);
      const ov = overrideMap.get(`${slot.id}|${dayKey}`);
      dayRows.push({
        date: dayKey,
        booked: counts.get(`${slot.id}|${dayKey}`) ?? 0,
        capacity: ov?.capacity ?? slot.capacity,
        isActive: ov?.isActive ?? slot.isActive,
        isOverridden: !!ov,
        note: ov?.note ?? null,
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
