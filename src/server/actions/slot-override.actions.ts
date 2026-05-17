"use server";

import { revalidatePath } from "next/cache";
import { requireAdmin } from "@/server/services/auth.service";
import {
  deleteSlotOverride,
  upsertSlotOverride,
} from "@/server/services/slot-override.service";

function parseDate(raw: string): Date {
  const d = new Date(`${raw}T00:00:00Z`);
  if (Number.isNaN(d.getTime())) throw new Error("Tanggal tidak valid.");
  return d;
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
