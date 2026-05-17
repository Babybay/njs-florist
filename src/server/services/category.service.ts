import { z } from "zod";
import { db } from "@/lib/db";

const slugRegex = /^[a-z0-9]+(?:-[a-z0-9]+)*$/;

export const categoryCreateSchema = z.object({
  name: z.string().trim().min(2).max(80),
  slug: z.string().trim().regex(slugRegex, "Slug hanya boleh huruf kecil, angka, dan dash."),
  description: z.string().trim().max(500).optional().nullable(),
  imageUrl: z.string().trim().url().optional().nullable(),
});

export const categoryUpdateSchema = categoryCreateSchema.partial().extend({
  id: z.string().min(1),
});

export async function createCategory(input: unknown) {
  const parsed = categoryCreateSchema.parse(input);
  return db.category.create({
    data: {
      name: parsed.name,
      slug: parsed.slug,
      description: parsed.description ?? null,
      imageUrl: parsed.imageUrl ?? null,
    },
  });
}

export async function updateCategory(input: unknown) {
  const parsed = categoryUpdateSchema.parse(input);
  const { id, ...rest } = parsed;
  return db.category.update({ where: { id }, data: rest });
}

export async function deleteCategory(id: string) {
  const productCount = await db.product.count({ where: { categoryId: id } });
  if (productCount > 0) {
    throw new Error(
      `Kategori masih dipakai ${productCount} produk. Pindahkan produk dulu sebelum menghapus.`,
    );
  }
  return db.category.delete({ where: { id } });
}

export async function listCategoriesWithCounts() {
  const categories = await db.category.findMany({ orderBy: { name: "asc" } });
  const counts = await db.product.groupBy({
    by: ["categoryId"],
    _count: true,
  });
  const map = new Map(counts.map((c) => [c.categoryId, c._count]));
  return categories.map((c) => ({ ...c, productCount: map.get(c.id) ?? 0 }));
}
