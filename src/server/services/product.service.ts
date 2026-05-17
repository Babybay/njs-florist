import { db } from "@/lib/db";
import {
  productImageInputSchema,
  productInputSchema,
  productUpdateSchema,
  variantInputSchema,
} from "@/server/validations/product.validation";

const ADMIN_PRODUCT_INCLUDE = {
  category: true,
  images: { orderBy: { sortOrder: "asc" } },
  variants: {
    include: {
      recipes: { include: { inventoryItem: true } },
    },
    orderBy: { priceAdjust: "asc" },
  },
  addons: { include: { addon: true } },
} as const;

export async function createProduct(input: unknown) {
  const parsed = productInputSchema.parse(input);
  return db.product.create({ data: parsed });
}

export async function updateProduct(input: unknown) {
  const parsed = productUpdateSchema.parse(input);
  const { id, ...rest } = parsed;
  return db.product.update({ where: { id }, data: rest });
}

export async function archiveProduct(id: string) {
  return db.product.update({ where: { id }, data: { status: "ARCHIVED" } });
}

export async function listProducts() {
  return db.product.findMany({
    include: {
      category: true,
      images: true,
      variants: true,
      addons: { include: { addon: true } },
    },
    orderBy: { createdAt: "desc" },
  });
}

export async function getProductAdminView(id: string) {
  return db.product.findUnique({
    where: { id },
    include: ADMIN_PRODUCT_INCLUDE,
  });
}

export async function addProductImage(input: unknown) {
  const parsed = productImageInputSchema.parse(input);
  return db.productImage.create({ data: parsed });
}

export async function removeProductImage(id: string) {
  return db.productImage.delete({ where: { id } });
}

export async function createVariantWithRecipes(input: unknown) {
  const parsed = variantInputSchema.parse(input);
  const { recipes, ...variantData } = parsed;
  return db.$transaction(async (tx) => {
    const variant = await tx.productVariant.create({ data: variantData });
    for (const recipe of recipes) {
      await tx.variantRecipe.create({
        data: {
          variantId: variant.id,
          inventoryItemId: recipe.inventoryItemId,
          quantityNeeded: recipe.quantityNeeded,
        },
      });
    }
    return variant;
  });
}

export async function archiveVariant(id: string) {
  return db.productVariant.update({ where: { id }, data: { isActive: false } });
}

export async function activateVariant(id: string) {
  return db.productVariant.update({ where: { id }, data: { isActive: true } });
}

export async function attachAddon(productId: string, addonId: string) {
  return db.productAddon.upsert({
    where: { productId_addonId: { productId, addonId } },
    update: {},
    create: { productId, addonId },
  });
}

export async function detachAddon(productId: string, addonId: string) {
  return db.productAddon.deleteMany({ where: { productId, addonId } });
}
