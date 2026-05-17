import { unstable_cache } from "next/cache";
import { db } from "@/lib/db";

export const CATALOG_TAGS = {
  categories: "catalog:categories",
  products: "catalog:products",
  productBySlug: (slug: string) => `catalog:product:${slug}`,
  slots: "catalog:slots",
} as const;

const STORE_PRODUCT_INCLUDE = {
  category: true,
  images: { orderBy: { sortOrder: "asc" } },
  variants: { where: { isActive: true }, orderBy: { priceAdjust: "asc" } },
  addons: { include: { addon: true } },
} as const;

export const listCategories = unstable_cache(
  async () => db.category.findMany({ orderBy: { name: "asc" } }),
  ["catalog-categories"],
  { tags: [CATALOG_TAGS.categories], revalidate: 600 },
);

export const getCategoryBySlug = unstable_cache(
  async (slug: string) => db.category.findUnique({ where: { slug } }),
  ["catalog-category-by-slug"],
  { tags: [CATALOG_TAGS.categories], revalidate: 600 },
);

export const listActiveProducts = unstable_cache(
  async () =>
    db.product.findMany({
      where: { status: "ACTIVE" },
      include: STORE_PRODUCT_INCLUDE,
      orderBy: { createdAt: "desc" },
    }),
  ["catalog-active-products"],
  { tags: [CATALOG_TAGS.products], revalidate: 300 },
);

export const listProductsByCategorySlug = unstable_cache(
  async (slug: string) =>
    db.product.findMany({
      where: { status: "ACTIVE", category: { slug } },
      include: STORE_PRODUCT_INCLUDE,
      orderBy: { createdAt: "desc" },
    }),
  ["catalog-products-by-category"],
  { tags: [CATALOG_TAGS.products], revalidate: 300 },
);

export const getProductBySlug = unstable_cache(
  async (slug: string) =>
    db.product.findUnique({
      where: { slug },
      include: STORE_PRODUCT_INCLUDE,
    }),
  ["catalog-product-by-slug"],
  { tags: [CATALOG_TAGS.products], revalidate: 300 },
);

export const listActiveDeliverySlots = unstable_cache(
  async () =>
    db.deliverySlot.findMany({
      where: { isActive: true },
      orderBy: { startTime: "asc" },
    }),
  ["catalog-active-slots"],
  { tags: [CATALOG_TAGS.slots], revalidate: 600 },
);

export async function listInventoryItems() {
  return db.inventoryItem.findMany({ orderBy: { name: "asc" } });
}

export async function listVariantsWithAvailability() {
  const variants = await db.productVariant.findMany({
    where: { isActive: true },
    include: {
      product: { select: { name: true, slug: true } },
      recipes: { include: { inventoryItem: true } },
    },
    orderBy: [{ product: { name: "asc" } }, { priceAdjust: "asc" }],
  });

  return variants.map((variant) => {
    const availability =
      variant.recipes.length === 0
        ? 0
        : Math.min(
            ...variant.recipes.map((recipe) =>
              Math.floor(recipe.inventoryItem.currentQty / recipe.quantityNeeded),
            ),
          );
    return { variant, availability };
  });
}

export type StoreProduct = Awaited<ReturnType<typeof listActiveProducts>>[number];
export type StoreCategory = Awaited<ReturnType<typeof listCategories>>[number];
export type StoreDeliverySlot = Awaited<ReturnType<typeof listActiveDeliverySlots>>[number];
