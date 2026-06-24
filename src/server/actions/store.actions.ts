"use server";

import { revalidatePath } from "next/cache";
import { requireAdmin } from "@/server/services/auth.service";
import { createStore, updateStore, setStoreActive } from "@/server/services/store.service";

function read(formData: FormData) {
  return {
    name: String(formData.get("name") ?? "").trim(),
    address: String(formData.get("address") ?? "").trim(),
    phone: String(formData.get("phone") ?? "").trim(),
    mapsUrl: String(formData.get("mapsUrl") ?? "").trim(),
    sortOrder: Number(formData.get("sortOrder") ?? 0),
    isActive: formData.get("isActive") === "on",
  };
}

export async function createStoreAction(formData: FormData) {
  await requireAdmin();
  await createStore(read(formData));
  revalidatePath("/admin/settings");
}

export async function updateStoreAction(id: string, formData: FormData) {
  await requireAdmin();
  await updateStore(id, read(formData));
  revalidatePath("/admin/settings");
}

export async function toggleStoreActiveAction(id: string, isActive: boolean) {
  await requireAdmin();
  await setStoreActive(id, isActive);
  revalidatePath("/admin/settings");
}
