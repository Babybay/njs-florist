"use server";

import { redirect } from "next/navigation";
import { revalidatePath, revalidateTag } from "next/cache";
import { requireAdmin } from "@/server/services/auth.service";
import { CATALOG_TAGS } from "@/server/services/catalog.service";
import { DASHBOARD_TAGS } from "@/server/services/dashboard.service";
import {
  addProductImage,
  archiveProduct,
  attachAddon,
  createProduct,
  detachAddon,
  listProducts,
  removeProductImage,
  updateProduct,
} from "@/server/services/product.service";

function invalidateCatalog() {
  revalidateTag(CATALOG_TAGS.products, "max");
  revalidateTag(DASHBOARD_TAGS.stats, "max");
}

export type AdminFormState = {
  error?: string;
  ok?: boolean;
};

const initialState: AdminFormState = {};

function num(value: FormDataEntryValue | null) {
  if (value == null) return undefined;
  const parsed = Number(value);
  return Number.isFinite(parsed) ? parsed : undefined;
}

function bool(value: FormDataEntryValue | null) {
  return value === "on" || value === "true";
}

function trimOrUndefined(value: FormDataEntryValue | null) {
  const trimmed = String(value ?? "").trim();
  return trimmed.length > 0 ? trimmed : undefined;
}

export async function listProductsAction() {
  return listProducts();
}

export async function createProductAction(
  _previousState: AdminFormState,
  formData: FormData,
): Promise<AdminFormState> {
  await requireAdmin();
  try {
    const product = await createProduct({
      name: String(formData.get("name") ?? "").trim(),
      slug: String(formData.get("slug") ?? "").trim(),
      description: String(formData.get("description") ?? "").trim(),
      basePrice: num(formData.get("basePrice")) ?? 0,
      categoryId: String(formData.get("categoryId") ?? ""),
      status: (formData.get("status") as "DRAFT" | "ACTIVE" | "ARCHIVED") ?? "DRAFT",
      isSameDayEligible: bool(formData.get("isSameDayEligible")),
    });

    const imageUrl = trimOrUndefined(formData.get("imageUrl"));
    if (imageUrl) {
      await addProductImage({
        productId: product.id,
        url: imageUrl,
        altText: trimOrUndefined(formData.get("imageAlt")),
        sortOrder: 0,
      });
    }

    invalidateCatalog();
    revalidatePath("/admin/products");
    redirect(`/admin/products/${product.id}/edit`);
  } catch (error) {
    if (error instanceof Error && error.message.includes("NEXT_REDIRECT")) throw error;
    return { error: error instanceof Error ? error.message : "Gagal membuat produk." };
  }

  return initialState;
}

export async function updateProductAction(
  _previousState: AdminFormState,
  formData: FormData,
): Promise<AdminFormState> {
  await requireAdmin();
  const id = String(formData.get("id") ?? "");
  if (!id) return { error: "ID produk tidak ada." };

  try {
    await updateProduct({
      id,
      name: String(formData.get("name") ?? "").trim(),
      slug: String(formData.get("slug") ?? "").trim(),
      description: String(formData.get("description") ?? "").trim(),
      basePrice: num(formData.get("basePrice")) ?? 0,
      categoryId: String(formData.get("categoryId") ?? ""),
      status: (formData.get("status") as "DRAFT" | "ACTIVE" | "ARCHIVED") ?? "DRAFT",
      isSameDayEligible: bool(formData.get("isSameDayEligible")),
    });
    invalidateCatalog();
    revalidatePath(`/admin/products/${id}/edit`);
    revalidatePath("/admin/products");
    return { ok: true };
  } catch (error) {
    return { error: error instanceof Error ? error.message : "Gagal memperbarui produk." };
  }
}

export async function archiveProductAction(formData: FormData) {
  await requireAdmin();
  const id = String(formData.get("id") ?? "");
  if (!id) return;
  await archiveProduct(id);
  invalidateCatalog();
  revalidatePath("/admin/products");
  redirect("/admin/products");
}

export async function addProductImageAction(formData: FormData) {
  await requireAdmin();
  const productId = String(formData.get("productId") ?? "");
  const url = String(formData.get("url") ?? "").trim();
  if (!productId || !url) return;
  await addProductImage({
    productId,
    url,
    altText: trimOrUndefined(formData.get("altText")),
    sortOrder: num(formData.get("sortOrder")) ?? 0,
  });
  invalidateCatalog();
  revalidatePath(`/admin/products/${productId}/edit`);
}

export async function removeProductImageAction(formData: FormData) {
  await requireAdmin();
  const id = String(formData.get("id") ?? "");
  const productId = String(formData.get("productId") ?? "");
  if (!id) return;
  await removeProductImage(id);
  invalidateCatalog();
  revalidatePath(`/admin/products/${productId}/edit`);
}

export async function attachAddonAction(formData: FormData) {
  await requireAdmin();
  const productId = String(formData.get("productId") ?? "");
  const addonId = String(formData.get("addonId") ?? "");
  if (!productId || !addonId) return;
  await attachAddon(productId, addonId);
  invalidateCatalog();
  revalidatePath(`/admin/products/${productId}/edit`);
}

export async function detachAddonAction(formData: FormData) {
  await requireAdmin();
  const productId = String(formData.get("productId") ?? "");
  const addonId = String(formData.get("addonId") ?? "");
  if (!productId || !addonId) return;
  await detachAddon(productId, addonId);
  invalidateCatalog();
  revalidatePath(`/admin/products/${productId}/edit`);
}
