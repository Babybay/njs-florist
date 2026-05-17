"use server";

import { revalidatePath, revalidateTag } from "next/cache";
import { db } from "@/lib/db";
import { requireAdmin } from "@/server/services/auth.service";
import { CATALOG_TAGS } from "@/server/services/catalog.service";
import {
  activateVariant,
  archiveVariant,
  createVariantWithRecipes,
} from "@/server/services/product.service";

function num(value: FormDataEntryValue | null) {
  if (value == null) return undefined;
  const parsed = Number(value);
  return Number.isFinite(parsed) ? parsed : undefined;
}

function trimOrUndefined(value: FormDataEntryValue | null) {
  const trimmed = String(value ?? "").trim();
  return trimmed.length > 0 ? trimmed : undefined;
}

export async function createVariantAction(formData: FormData) {
  await requireAdmin();
  const productId = String(formData.get("productId") ?? "");
  if (!productId) return;

  const inventoryIds = formData.getAll("recipeInventoryItemId").map((v) => String(v));
  const quantities = formData.getAll("recipeQuantityNeeded").map((v) => Number(v) || 0);
  const recipes = inventoryIds
    .map((inventoryItemId, index) => ({
      inventoryItemId,
      quantityNeeded: quantities[index] ?? 0,
    }))
    .filter((r) => r.inventoryItemId && r.quantityNeeded > 0);

  await createVariantWithRecipes({
    productId,
    name: String(formData.get("name") ?? "").trim(),
    size: trimOrUndefined(formData.get("size")),
    color: trimOrUndefined(formData.get("color")),
    wrapper: trimOrUndefined(formData.get("wrapper")),
    priceAdjust: num(formData.get("priceAdjust")) ?? 0,
    sku: String(formData.get("sku") ?? "").trim(),
    isActive: true,
    recipes,
  });
  revalidateTag(CATALOG_TAGS.products, "max");
  revalidatePath(`/admin/products/${productId}/edit`);
}

export async function archiveVariantAction(formData: FormData) {
  await requireAdmin();
  const id = String(formData.get("id") ?? "");
  const productId = String(formData.get("productId") ?? "");
  if (!id) return;
  await archiveVariant(id);
  revalidateTag(CATALOG_TAGS.products, "max");
  revalidatePath(`/admin/products/${productId}/edit`);
}

export async function activateVariantAction(formData: FormData) {
  await requireAdmin();
  const id = String(formData.get("id") ?? "");
  const productId = String(formData.get("productId") ?? "");
  if (!id) return;
  await activateVariant(id);
  revalidateTag(CATALOG_TAGS.products, "max");
  revalidatePath(`/admin/products/${productId}/edit`);
}

export async function addVariantRecipeAction(formData: FormData) {
  await requireAdmin();
  const variantId = String(formData.get("variantId") ?? "");
  const productId = String(formData.get("productId") ?? "");
  const inventoryItemId = String(formData.get("inventoryItemId") ?? "");
  const quantityNeeded = Number(formData.get("quantityNeeded") ?? 0);
  if (!variantId || !inventoryItemId || quantityNeeded <= 0) return;
  await db.variantRecipe.upsert({
    where: { variantId_inventoryItemId: { variantId, inventoryItemId } },
    update: { quantityNeeded },
    create: { variantId, inventoryItemId, quantityNeeded },
  });
  revalidateTag(CATALOG_TAGS.products, "max");
  revalidatePath(`/admin/products/${productId}/edit`);
}

export async function removeVariantRecipeAction(formData: FormData) {
  await requireAdmin();
  const id = String(formData.get("id") ?? "");
  const productId = String(formData.get("productId") ?? "");
  if (!id) return;
  await db.variantRecipe.delete({ where: { id } });
  revalidateTag(CATALOG_TAGS.products, "max");
  revalidatePath(`/admin/products/${productId}/edit`);
}
