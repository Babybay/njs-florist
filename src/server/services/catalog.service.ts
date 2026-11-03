import { unstable_cache } from "next/cache";
import type { Category, Prisma } from "@prisma/client";
import { db } from "@/lib/db";
import { isUiPreview } from "@/lib/ui-preview";

const previewCategories: Category[] = [
  { id: "preview-signature", name: "Signature bouquet", slug: "signature", description: null, imageUrl: null, createdAt: new Date("2026-01-01") },
];

const previewProducts: StoreProduct[] = [
  {
    id: "preview-peony-garden",
    categoryId: "preview-signature",
    category: previewCategories[0],
    name: "Peony garden",
    slug: "peony-garden",
    description: "Rangkaian bunga segar untuk preview tampilan katalog.",
    basePrice: 425000,
    status: "ACTIVE",
    isSameDayEligible: true,
    createdAt: new Date("2026-01-01"),
    updatedAt: new Date("2026-01-01"),
    images: [{ id: "preview-image-1", productId: "preview-peony-garden", url: "https://images.unsplash.com/photo-1561181286-d3fee7d55364?auto=format&fit=crop&w=1200&q=85", altText: "Peony garden bouquet", sortOrder: 0 }],
    variants: [{ id: "preview-variant-1", productId: "preview-peony-garden", name: "Standard", size: null, color: null, wrapper: null, priceAdjust: 0, sku: "PREVIEW-PEONY", isActive: true }],
    addons: [],
  },
  {
    id: "preview-rose-letter",
    categoryId: "preview-signature",
    category: previewCategories[0],
    name: "Rose letter",
    slug: "rose-letter",
    description: "Rangkaian bunga segar untuk preview tampilan katalog.",
    basePrice: 365000,
    status: "ACTIVE",
    isSameDayEligible: true,
    createdAt: new Date("2026-01-02"),
    updatedAt: new Date("2026-01-02"),
    images: [{ id: "preview-image-2", productId: "preview-rose-letter", url: "https://images.unsplash.com/photo-1518895949257-7621c3c786d7?auto=format&fit=crop&w=1200&q=85", altText: "Rose letter bouquet", sortOrder: 0 }],
    variants: [{ id: "preview-variant-2", productId: "preview-rose-letter", name: "Standard", size: null, color: null, wrapper: null, priceAdjust: 0, sku: "PREVIEW-ROSE", isActive: true }],
    addons: [],
  },
  {
    id: "preview-wild-flower",
    categoryId: "preview-signature",
    category: previewCategories[0],
    name: "Wild flower",
    slug: "wild-flower",
    description: "Rangkaian bunga segar untuk preview tampilan katalog.",
    basePrice: 285000,
    status: "ACTIVE",
    isSameDayEligible: false,
    createdAt: new Date("2026-01-03"),
    updatedAt: new Date("2026-01-03"),
    images: [{ id: "preview-image-3", productId: "preview-wild-flower", url: "https://images.unsplash.com/photo-1455659817273-f96807779a8a?auto=format&fit=crop&w=1200&q=85", altText: "Wild flower bouquet", sortOrder: 0 }],
    variants: [{ id: "preview-variant-3", productId: "preview-wild-flower", name: "Standard", size: null, color: null, wrapper: null, priceAdjust: 0, sku: "PREVIEW-WILD", isActive: true }],
    addons: [],
  },
];

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
  async () => isUiPreview ? previewCategories : db.category.findMany({ orderBy: { name: "asc" } }),
  ["catalog-categories", String(isUiPreview)],
  { tags: [CATALOG_TAGS.categories], revalidate: 600 },
);

export const getCategoryBySlug = unstable_cache(
  async (slug: string) => isUiPreview ? previewCategories.find((category) => category.slug === slug) ?? null : db.category.findUnique({ where: { slug } }),
  ["catalog-category-by-slug", String(isUiPreview)],
  { tags: [CATALOG_TAGS.categories], revalidate: 600 },
);

export const listActiveProducts = unstable_cache(
  async () =>
    isUiPreview ? previewProducts : db.product.findMany({
      where: { status: "ACTIVE" },
      include: STORE_PRODUCT_INCLUDE,
      orderBy: { createdAt: "desc" },
    }),
  ["catalog-active-products", String(isUiPreview)],
  { tags: [CATALOG_TAGS.products], revalidate: 300 },
);

export const listProductsByCategorySlug = unstable_cache(
  async (slug: string) =>
    isUiPreview ? previewProducts.filter((product) => product.category.slug === slug) : db.product.findMany({
      where: { status: "ACTIVE", category: { slug } },
      include: STORE_PRODUCT_INCLUDE,
      orderBy: { createdAt: "desc" },
    }),
  ["catalog-products-by-category", String(isUiPreview)],
  { tags: [CATALOG_TAGS.products], revalidate: 300 },
);

export const getProductBySlug = unstable_cache(
  async (slug: string) =>
    isUiPreview ? previewProducts.find((product) => product.slug === slug) ?? null : db.product.findUnique({
      where: { slug },
      include: STORE_PRODUCT_INCLUDE,
    }),
  ["catalog-product-by-slug", String(isUiPreview)],
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

export type StoreProduct = Prisma.ProductGetPayload<{ include: typeof STORE_PRODUCT_INCLUDE }>;
export type StoreCategory = Awaited<ReturnType<typeof listCategories>>[number];
export type StoreDeliverySlot = Awaited<ReturnType<typeof listActiveDeliverySlots>>[number];
