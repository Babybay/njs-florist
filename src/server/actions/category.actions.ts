"use server";

import { revalidatePath, revalidateTag } from "next/cache";
import { requireAdmin } from "@/server/services/auth.service";
import { CATALOG_TAGS } from "@/server/services/catalog.service";
import {
  createCategory,
  deleteCategory,
  updateCategory,
} from "@/server/services/category.service";

function invalidate() {
  revalidateTag(CATALOG_TAGS.categories, "max");
  revalidateTag(CATALOG_TAGS.products, "max");
  revalidatePath("/admin/categories");
}

function form(formData: FormData) {
  const get = (k: string) => formData.get(k)?.toString().trim() ?? "";
  return {
    id: get("id") || undefined,
    name: get("name"),
    slug: get("slug"),
    description: get("description") || null,
    imageUrl: get("imageUrl") || null,
  };
}

export async function createCategoryAction(formData: FormData) {
  await requireAdmin();
  const f = form(formData);
  await createCategory({
    name: f.name,
    slug: f.slug,
    description: f.description,
    imageUrl: f.imageUrl,
  });
  invalidate();
}

export async function updateCategoryAction(formData: FormData) {
  await requireAdmin();
  const f = form(formData);
  if (!f.id) throw new Error("Category id missing.");
  await updateCategory({
    id: f.id,
    name: f.name,
    slug: f.slug,
    description: f.description,
    imageUrl: f.imageUrl,
  });
  invalidate();
}

export async function deleteCategoryAction(formData: FormData) {
  await requireAdmin();
  const id = String(formData.get("id") ?? "");
  if (!id) throw new Error("Category id missing.");
  await deleteCategory(id);
  invalidate();
}
