"use server";

import { revalidatePath, revalidateTag } from "next/cache";
import { db } from "@/lib/db";
import { requireAdmin } from "@/server/services/auth.service";
import { logActivity } from "@/server/services/activity-log.service";
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
  const actor = await requireAdmin();
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

  const variant = await createVariantWithRecipes({
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
  await logActivity({
    actor,
    action: "product.variant_created",
    entity: "product",
    entityId: productId,
    metadata: {
      variantId: variant.id,
      variantName: variant.name,
      sku: variant.sku,
      priceAdjust: variant.priceAdjust,
      recipeCount: recipes.length,
    },
  });
  revalidateTag(CATALOG_TAGS.products, "max");
  revalidatePath(`/admin/products/${productId}/edit`);
}

export async function archiveVariantAction(formData: FormData) {
  const actor = await requireAdmin();
  const id = String(formData.get("id") ?? "");
  const productId = String(formData.get("productId") ?? "");
  if (!id) return;
  const variant = await archiveVariant(id);
  await logActivity({
    actor,
    action: "product.variant_archived",
    entity: "product",
    entityId: productId || variant.productId,
    metadata: {
      variantId: variant.id,
      variantName: variant.name,
      sku: variant.sku,
    },
  });
  revalidateTag(CATALOG_TAGS.products, "max");
  revalidatePath(`/admin/products/${productId}/edit`);
}

export async function activateVariantAction(formData: FormData) {
  const actor = await requireAdmin();
  const id = String(formData.get("id") ?? "");
  const productId = String(formData.get("productId") ?? "");
  if (!id) return;
  const variant = await activateVariant(id);
  await logActivity({
    actor,
    action: "product.variant_activated",
    entity: "product",
    entityId: productId || variant.productId,
    metadata: {
      variantId: variant.id,
      variantName: variant.name,
      sku: variant.sku,
    },
  });
  revalidateTag(CATALOG_TAGS.products, "max");
  revalidatePath(`/admin/products/${productId}/edit`);
}

export async function addVariantRecipeAction(formData: FormData) {
  const actor = await requireAdmin();
  const variantId = String(formData.get("variantId") ?? "");
  const productId = String(formData.get("productId") ?? "");
  const inventoryItemId = String(formData.get("inventoryItemId") ?? "");
  const quantityNeeded = Number(formData.get("quantityNeeded") ?? 0);
  if (!variantId || !inventoryItemId || quantityNeeded <= 0) return;
  const [variant, inventoryItem] = await Promise.all([
    db.productVariant.findUnique({ where: { id: variantId }, select: { name: true, sku: true } }),
    db.inventoryItem.findUnique({ where: { id: inventoryItemId }, select: { name: true, unit: true } }),
  ]);
  await db.variantRecipe.upsert({
    where: { variantId_inventoryItemId: { variantId, inventoryItemId } },
    update: { quantityNeeded },
    create: { variantId, inventoryItemId, quantityNeeded },
  });
  await logActivity({
    actor,
    action: "product.recipe_updated",
    entity: "product",
    entityId: productId,
    metadata: {
      variantId,
      variantName: variant?.name ?? null,
      sku: variant?.sku ?? null,
      inventoryItemId,
      inventoryItemName: inventoryItem?.name ?? null,
      unit: inventoryItem?.unit ?? null,
      quantityNeeded,
    },
  });
  revalidateTag(CATALOG_TAGS.products, "max");
  revalidatePath(`/admin/products/${productId}/edit`);
}

export async function removeVariantRecipeAction(formData: FormData) {
  const actor = await requireAdmin();
  const id = String(formData.get("id") ?? "");
  const productId = String(formData.get("productId") ?? "");
  if (!id) return;
  const recipe = await db.variantRecipe.findUnique({
    where: { id },
    include: {
      variant: { select: { id: true, name: true, sku: true } },
      inventoryItem: { select: { id: true, name: true, unit: true } },
    },
  });
  await db.variantRecipe.delete({ where: { id } });
  await logActivity({
    actor,
    action: "product.recipe_removed",
    entity: "product",
    entityId: productId,
    metadata: {
      recipeId: id,
      variantId: recipe?.variant.id ?? null,
      variantName: recipe?.variant.name ?? null,
      sku: recipe?.variant.sku ?? null,
      inventoryItemId: recipe?.inventoryItem.id ?? null,
      inventoryItemName: recipe?.inventoryItem.name ?? null,
      unit: recipe?.inventoryItem.unit ?? null,
      quantityNeeded: recipe?.quantityNeeded ?? null,
    },
  });
  revalidateTag(CATALOG_TAGS.products, "max");
  revalidatePath(`/admin/products/${productId}/edit`);
}
