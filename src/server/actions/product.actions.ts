"use server";

import { redirect } from "next/navigation";
import { revalidatePath, revalidateTag } from "next/cache";
import { db } from "@/lib/db";
import { requireAdmin } from "@/server/services/auth.service";
import { logActivity } from "@/server/services/activity-log.service";
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

const PRODUCT_AUDIT_FIELDS = [
  "name",
  "slug",
  "description",
  "basePrice",
  "categoryId",
  "status",
  "isSameDayEligible",
] as const;

type ProductAuditField = (typeof PRODUCT_AUDIT_FIELDS)[number];

type ProductAuditSnapshot = Record<ProductAuditField, string | number | boolean | null>;

function productSnapshot(product: Partial<ProductAuditSnapshot>): ProductAuditSnapshot {
  return {
    name: product.name ?? null,
    slug: product.slug ?? null,
    description: product.description ?? null,
    basePrice: product.basePrice ?? null,
    categoryId: product.categoryId ?? null,
    status: product.status ?? null,
    isSameDayEligible: product.isSameDayEligible ?? null,
  };
}

function diffProduct(before: ProductAuditSnapshot, after: ProductAuditSnapshot) {
  return PRODUCT_AUDIT_FIELDS.filter((field) => before[field] !== after[field]).map((field) => ({
    field,
    before: before[field],
    after: after[field],
  }));
}

export async function listProductsAction() {
  return listProducts();
}

export async function createProductAction(
  _previousState: AdminFormState,
  formData: FormData,
): Promise<AdminFormState> {
  const actor = await requireAdmin();
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

    await logActivity({
      actor,
      action: "product.created",
      entity: "product",
      entityId: product.id,
      metadata: {
        product: productSnapshot(product),
        initialImageUrl: imageUrl ?? null,
      },
    });

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
  const actor = await requireAdmin();
  const id = String(formData.get("id") ?? "");
  if (!id) return { error: "ID produk tidak ada." };

  try {
    const before = await db.product.findUnique({
      where: { id },
      select: {
        name: true,
        slug: true,
        description: true,
        basePrice: true,
        categoryId: true,
        status: true,
        isSameDayEligible: true,
      },
    });
    if (!before) return { error: "Produk tidak ditemukan." };

    const updated = await updateProduct({
      id,
      name: String(formData.get("name") ?? "").trim(),
      slug: String(formData.get("slug") ?? "").trim(),
      description: String(formData.get("description") ?? "").trim(),
      basePrice: num(formData.get("basePrice")) ?? 0,
      categoryId: String(formData.get("categoryId") ?? ""),
      status: (formData.get("status") as "DRAFT" | "ACTIVE" | "ARCHIVED") ?? "DRAFT",
      isSameDayEligible: bool(formData.get("isSameDayEligible")),
    });
    const beforeSnapshot = productSnapshot(before);
    const afterSnapshot = productSnapshot(updated);
    const changes = diffProduct(beforeSnapshot, afterSnapshot);

    if (changes.length > 0) {
      await logActivity({
        actor,
        action: "product.updated",
        entity: "product",
        entityId: id,
        metadata: {
          changes,
        },
      });
    }

    invalidateCatalog();
    revalidatePath(`/admin/products/${id}/edit`);
    revalidatePath("/admin/products");
    return { ok: true };
  } catch (error) {
    return { error: error instanceof Error ? error.message : "Gagal memperbarui produk." };
  }
}

export async function archiveProductAction(formData: FormData) {
  const actor = await requireAdmin();
  const id = String(formData.get("id") ?? "");
  if (!id) return;
  const before = await db.product.findUnique({
    where: { id },
    select: { status: true },
  });
  await archiveProduct(id);
  await logActivity({
    actor,
    action: "product.archived",
    entity: "product",
    entityId: id,
    metadata: {
      changes: [{ field: "status", before: before?.status ?? null, after: "ARCHIVED" }],
    },
  });
  invalidateCatalog();
  revalidatePath("/admin/products");
  redirect("/admin/products");
}

export async function addProductImageAction(formData: FormData) {
  const actor = await requireAdmin();
  const productId = String(formData.get("productId") ?? "");
  const url = String(formData.get("url") ?? "").trim();
  if (!productId || !url) return;
  const image = await addProductImage({
    productId,
    url,
    altText: trimOrUndefined(formData.get("altText")),
    sortOrder: num(formData.get("sortOrder")) ?? 0,
  });
  await logActivity({
    actor,
    action: "product.image_added",
    entity: "product",
    entityId: productId,
    metadata: {
      imageId: image.id,
      url: image.url,
      altText: image.altText ?? null,
      sortOrder: image.sortOrder,
    },
  });
  invalidateCatalog();
  revalidatePath(`/admin/products/${productId}/edit`);
}

export async function removeProductImageAction(formData: FormData) {
  const actor = await requireAdmin();
  const id = String(formData.get("id") ?? "");
  const productId = String(formData.get("productId") ?? "");
  if (!id) return;
  const image = await db.productImage.findUnique({
    where: { id },
    select: { url: true, altText: true, sortOrder: true },
  });
  await removeProductImage(id);
  await logActivity({
    actor,
    action: "product.image_removed",
    entity: "product",
    entityId: productId,
    metadata: {
      imageId: id,
      url: image?.url ?? null,
      altText: image?.altText ?? null,
      sortOrder: image?.sortOrder ?? null,
    },
  });
  invalidateCatalog();
  revalidatePath(`/admin/products/${productId}/edit`);
}

export async function attachAddonAction(formData: FormData) {
  const actor = await requireAdmin();
  const productId = String(formData.get("productId") ?? "");
  const addonId = String(formData.get("addonId") ?? "");
  if (!productId || !addonId) return;
  await attachAddon(productId, addonId);
  const addon = await db.addon.findUnique({ where: { id: addonId }, select: { name: true } });
  await logActivity({
    actor,
    action: "product.addon_attached",
    entity: "product",
    entityId: productId,
    metadata: {
      addonId,
      addonName: addon?.name ?? null,
    },
  });
  invalidateCatalog();
  revalidatePath(`/admin/products/${productId}/edit`);
}

export async function detachAddonAction(formData: FormData) {
  const actor = await requireAdmin();
  const productId = String(formData.get("productId") ?? "");
  const addonId = String(formData.get("addonId") ?? "");
  if (!productId || !addonId) return;
  const addon = await db.addon.findUnique({ where: { id: addonId }, select: { name: true } });
  await detachAddon(productId, addonId);
  await logActivity({
    actor,
    action: "product.addon_detached",
    entity: "product",
    entityId: productId,
    metadata: {
      addonId,
      addonName: addon?.name ?? null,
    },
  });
  invalidateCatalog();
  revalidatePath(`/admin/products/${productId}/edit`);
}
