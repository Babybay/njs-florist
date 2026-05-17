"use server";

import { revalidatePath, revalidateTag } from "next/cache";
import { requireAdmin } from "@/server/services/auth.service";
import { CATALOG_TAGS } from "@/server/services/catalog.service";
import {
  createDeliverySlot,
  setSlotActive,
  updateDeliverySlot,
} from "@/server/services/delivery-slot.service";

function invalidateSlots() {
  revalidateTag(CATALOG_TAGS.slots, "max");
}

function parseForm(formData: FormData) {
  return {
    id: formData.get("id")?.toString(),
    label: formData.get("label")?.toString() ?? "",
    startTime: formData.get("startTime")?.toString() ?? "",
    endTime: formData.get("endTime")?.toString() ?? "",
    capacity: formData.get("capacity")?.toString() ?? "0",
    isActive: formData.get("isActive") === "on",
  };
}

export async function createDeliverySlotAction(formData: FormData) {
  await requireAdmin();
  const { label, startTime, endTime, capacity } = parseForm(formData);
  await createDeliverySlot({ label, startTime, endTime, capacity });
  invalidateSlots();
  revalidatePath("/admin/delivery");
}

export async function updateDeliverySlotAction(formData: FormData) {
  await requireAdmin();
  const { id, label, startTime, endTime, capacity } = parseForm(formData);
  if (!id) throw new Error("Slot id missing.");
  await updateDeliverySlot({ id, label, startTime, endTime, capacity });
  invalidateSlots();
  revalidatePath("/admin/delivery");
}

export async function toggleDeliverySlotAction(formData: FormData) {
  await requireAdmin();
  const id = formData.get("id")?.toString();
  const next = formData.get("next") === "true";
  if (!id) throw new Error("Slot id missing.");
  await setSlotActive(id, next);
  invalidateSlots();
  revalidatePath("/admin/delivery");
}
