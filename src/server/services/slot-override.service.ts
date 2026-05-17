import { z } from "zod";
import { db } from "@/lib/db";

export const overrideUpsertSchema = z.object({
  slotId: z.string().min(1),
  date: z.coerce.date(),
  capacity: z.coerce.number().int().min(0).max(10_000).optional().nullable(),
  isActive: z.coerce.boolean().optional().nullable(),
  note: z.string().max(200).optional().nullable(),
});

function dateOnly(d: Date): Date {
  const utc = new Date(Date.UTC(d.getFullYear(), d.getMonth(), d.getDate()));
  return utc;
}

export async function upsertSlotOverride(input: unknown) {
  const parsed = overrideUpsertSchema.parse(input);
  const date = dateOnly(parsed.date);

  // If both capacity and isActive end up null/empty, treat as delete.
  const hasCapacity = parsed.capacity !== null && parsed.capacity !== undefined;
  const hasActive = parsed.isActive !== null && parsed.isActive !== undefined;

  if (!hasCapacity && !hasActive && !parsed.note) {
    return db.deliverySlotOverride.deleteMany({
      where: { slotId: parsed.slotId, date },
    });
  }

  return db.deliverySlotOverride.upsert({
    where: { slotId_date: { slotId: parsed.slotId, date } },
    create: {
      slotId: parsed.slotId,
      date,
      capacity: hasCapacity ? parsed.capacity : null,
      isActive: hasActive ? parsed.isActive : null,
      note: parsed.note ?? null,
    },
    update: {
      capacity: hasCapacity ? parsed.capacity : null,
      isActive: hasActive ? parsed.isActive : null,
      note: parsed.note ?? null,
    },
  });
}

export async function deleteSlotOverride(slotId: string, date: Date) {
  return db.deliverySlotOverride.deleteMany({
    where: { slotId, date: dateOnly(date) },
  });
}

export async function getOverridesForDate(date: Date) {
  return db.deliverySlotOverride.findMany({
    where: { date: dateOnly(date) },
  });
}

export async function listUpcomingOverrides(days = 60) {
  const today = dateOnly(new Date());
  const horizon = new Date(today);
  horizon.setDate(horizon.getDate() + days);

  return db.deliverySlotOverride.findMany({
    where: { date: { gte: today, lte: horizon } },
    include: { slot: true },
    orderBy: [{ date: "asc" }, { slot: { startTime: "asc" } }],
  });
}

export async function getOverridesInRange(from: Date, to: Date) {
  return db.deliverySlotOverride.findMany({
    where: { date: { gte: dateOnly(from), lte: dateOnly(to) } },
  });
}

export type EffectiveSlot = {
  slotId: string;
  capacity: number;
  isActive: boolean;
  isOverridden: boolean;
  note: string | null;
};

export async function getEffectiveSlotsForDate(date: Date): Promise<EffectiveSlot[]> {
  const [slots, overrides] = await Promise.all([
    db.deliverySlot.findMany({ orderBy: { startTime: "asc" } }),
    getOverridesForDate(date),
  ]);

  const overrideMap = new Map(overrides.map((o) => [o.slotId, o]));
  return slots.map((slot) => {
    const ov = overrideMap.get(slot.id);
    return {
      slotId: slot.id,
      capacity: ov?.capacity ?? slot.capacity,
      isActive: ov?.isActive ?? slot.isActive,
      isOverridden: !!ov,
      note: ov?.note ?? null,
    };
  });
}
