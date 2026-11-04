import type { Prisma } from "@prisma/client";
import { db } from "@/lib/db";
import {
  addPickupDays, earliestPickupDate, PICKUP_HOLD_MINUTES, pickupDateColumn,
  pickupDateKey, pickupDayBounds, pickupSlotStatus, type PickupAvailability,
} from "@/lib/pickup-schedule";
import { getSettingNumber, SETTING_KEYS } from "@/server/services/settings.service";

type ScheduleDb = Pick<Prisma.TransactionClient, "deliverySlot" | "deliverySlotOverride" | "order">;

/** Pending checkouts occupy capacity only for their 15-minute payment window. */
export function occupyingPickupOrders(now: Date): Prisma.OrderWhereInput {
  return { OR: [
    { status: { in: ["PAID", "PREPARING", "READY_FOR_DELIVERY", "OUT_FOR_DELIVERY", "DELIVERED", "COMPLETED"] } },
    { status: "PENDING_PAYMENT", createdAt: { gt: new Date(now.getTime() - PICKUP_HOLD_MINUTES * 60_000) } },
  ] };
}

export async function getPickupAvailability(
  storeId: string, from: string, to: string,
  options: { client?: ScheduleDb; cutoffHour?: number; now?: Date } = {},
): Promise<PickupAvailability> {
  const client = options.client ?? db;
  const now = options.now ?? new Date();
  const cutoffHour = options.cutoffHour ?? await getSettingNumber(SETTING_KEYS.SAME_DAY_CUTOFF_HOUR);
  const { start } = pickupDayBounds(from);
  const { end } = pickupDayBounds(to);
  const [slots, overrides, orders] = await Promise.all([
    // Include inactive templates: a date-specific override can reopen them.
    client.deliverySlot.findMany({ where: { storeId }, orderBy: { startTime: "asc" } }),
    client.deliverySlotOverride.findMany({ where: {
      slot: { storeId }, date: { gte: pickupDateColumn(from), lte: pickupDateColumn(to) },
    } }),
    client.order.groupBy({
      by: ["deliverySlotId", "deliveryDate"],
      where: { storeId, deliveryDate: { gte: start, lt: end }, ...occupyingPickupOrders(now) },
      _count: { _all: true },
    }),
  ]);
  const counts = new Map<string, number>();
  for (const order of orders) {
    const key = `${order.deliverySlotId}|${pickupDateKey(order.deliveryDate)}`;
    counts.set(key, (counts.get(key) ?? 0) + order._count._all);
  }
  const overridesByDay = new Map(overrides.map((row) => [`${row.slotId}|${row.date.toISOString().slice(0, 10)}`, row]));
  const days: PickupAvailability["days"] = [];
  for (let date = from; date <= to; date = addPickupDays(date, 1)) {
    days.push({ date, slots: slots.map((slot) => {
      const override = overridesByDay.get(`${slot.id}|${date}`);
      const capacity = override?.capacity ?? slot.capacity;
      const booked = counts.get(`${slot.id}|${date}`) ?? 0;
      return {
        id: slot.id, label: slot.label, startTime: slot.startTime, endTime: slot.endTime,
        remaining: Math.max(0, capacity - booked),
        status: pickupSlotStatus({ date, startTime: slot.startTime, capacity, booked,
          isActive: override?.isActive ?? slot.isActive, cutoffHour, now }),
      };
    }) });
  }
  return { storeId, today: pickupDateKey(now), minDate: earliestPickupDate(cutoffHour, now), cutoffHour, days };
}
