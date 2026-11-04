"use server";

import { revalidatePath } from "next/cache";
import { requireAdmin } from "@/server/services/auth.service";
import { pickupDateColumn } from "@/lib/pickup-schedule";
import { setStoreDayAvailability } from "@/server/services/store-day.service";
import {
  deleteSlotOverride,
  upsertSlotOverride,
} from "@/server/services/slot-override.service";

function parseDate(raw: string): Date {
  return pickupDateColumn(raw);
}

export async function upsertSlotOverrideAction(formData: FormData) {
  await requireAdmin();
  const slotId = String(formData.get("slotId") ?? "").trim();
  const dateRaw = String(formData.get("date") ?? "").trim();
  const capacityRaw = String(formData.get("capacity") ?? "").trim();
  const activeRaw = formData.get("isActive");
  const note = String(formData.get("note") ?? "").trim() || null;

  if (!slotId || !dateRaw) throw new Error("slotId dan date wajib.");

  const date = parseDate(dateRaw);

  let isActive: boolean | null = null;
  if (activeRaw === "active") isActive = true;
  else if (activeRaw === "disabled") isActive = false;

  const capacity = capacityRaw !== "" ? Number(capacityRaw) : null;

  await upsertSlotOverride({
    slotId,
    date,
    capacity,
    isActive,
    note,
  });

  revalidatePath("/admin/delivery");
}

export async function deleteSlotOverrideAction(formData: FormData) {
  await requireAdmin();
  const slotId = String(formData.get("slotId") ?? "").trim();
  const dateRaw = String(formData.get("date") ?? "").trim();
  if (!slotId || !dateRaw) throw new Error("slotId dan date wajib.");

  await deleteSlotOverride(slotId, parseDate(dateRaw));
  revalidatePath("/admin/delivery");
}

export async function setStoreDayAvailabilityAction(formData: FormData) {
  await requireAdmin();
  const storeId = String(formData.get("storeId") ?? "").trim();
  const date = String(formData.get("date") ?? "");
  const mode = String(formData.get("mode") ?? "");
  if (!storeId || !["open", "close", "reset"].includes(mode)) throw new Error("Pilih toko, tanggal, dan tindakan yang valid.");
  const result = await setStoreDayAvailability(storeId, date, mode as "open" | "close" | "reset");
  revalidatePath("/admin/delivery");
  return result;
}
