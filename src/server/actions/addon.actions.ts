"use server";

import { revalidatePath, revalidateTag } from "next/cache";
import { requireAdmin } from "@/server/services/auth.service";
import {
  createAddon,
  setAddonActive,
  updateAddon,
} from "@/server/services/addon.service";
import { CATALOG_TAGS } from "@/server/services/catalog.service";

function invalidate() {
  revalidateTag(CATALOG_TAGS.products, "max");
  revalidatePath("/admin/addons");
}

function form(formData: FormData) {
  const get = (k: string) => formData.get(k)?.toString().trim() ?? "";
  return {
    id: get("id") || undefined,
    name: get("name"),
    price: get("price"),
    stockItemId: get("stockItemId") || null,
    isActive: formData.get("isActive") === "on",
  };
}

export async function createAddonAction(formData: FormData) {
  await requireAdmin();
  const f = form(formData);
  await createAddon({
    name: f.name,
    price: f.price,
    stockItemId: f.stockItemId,
    isActive: f.isActive,
  });
  invalidate();
}

export async function updateAddonAction(formData: FormData) {
  await requireAdmin();
  const f = form(formData);
  if (!f.id) throw new Error("Addon id missing.");
  await updateAddon({
    id: f.id,
    name: f.name,
    price: f.price,
    stockItemId: f.stockItemId,
    isActive: f.isActive,
  });
  invalidate();
}

export async function toggleAddonAction(formData: FormData) {
  await requireAdmin();
  const id = String(formData.get("id") ?? "");
  const next = formData.get("next") === "true";
  if (!id) throw new Error("Addon id missing.");
  await setAddonActive(id, next);
  invalidate();
}
