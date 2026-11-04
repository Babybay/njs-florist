import { z } from "zod";
import { db } from "@/lib/db";

const timeRegex = /^([01]\d|2[0-3]):[0-5]\d$/;

const slotFields = z.object({
  storeId: z.string().min(1, "Pilih toko."),
  label: z.string().trim().min(1).max(60),
  startTime: z.string().regex(timeRegex, "Format jam HH:MM"),
  endTime: z.string().regex(timeRegex, "Format jam HH:MM"),
  capacity: z.coerce.number().int().min(1).max(500),
  isActive: z.coerce.boolean().optional().default(true),
});

const validWindow = (slot: { startTime?: string; endTime?: string }) =>
  !slot.startTime || !slot.endTime || slot.endTime > slot.startTime;
const windowError = { message: "Jam selesai harus setelah jam mulai pada hari yang sama.", path: ["endTime"] };
export const slotCreateSchema = slotFields.refine(validWindow, windowError);
export const slotUpdateSchema = slotFields.partial().extend({
  id: z.string().min(1),
}).refine(validWindow, windowError);

export type SlotCreateInput = z.input<typeof slotCreateSchema>;

export async function createDeliverySlot(input: unknown) {
  const parsed = slotCreateSchema.parse(input);
  return db.deliverySlot.create({ data: parsed });
}

export async function updateDeliverySlot(input: unknown) {
  const parsed = slotUpdateSchema.parse(input);
  const { id, ...rest } = parsed;
  const current = await db.deliverySlot.findUniqueOrThrow({ where: { id } });
  if (!validWindow({ ...current, ...rest })) throw new Error(windowError.message);
  return db.deliverySlot.update({ where: { id }, data: rest });
}

export async function setSlotActive(slotId: string, isActive: boolean) {
  return db.deliverySlot.update({ where: { id: slotId }, data: { isActive } });
}
