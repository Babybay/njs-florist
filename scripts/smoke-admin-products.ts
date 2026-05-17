import { PrismaClient } from "@prisma/client";
import {
  addProductImage,
  archiveProduct,
  attachAddon,
  createProduct,
  createVariantWithRecipes,
  detachAddon,
  getProductAdminView,
  removeProductImage,
  updateProduct,
} from "../src/server/services/product.service";

const db = new PrismaClient();

async function main() {
  const stamp = Date.now();
  const slug = `smoke-${stamp}`;
  const category = await db.category.findFirst({ where: { slug: "ulang-tahun" } });
  if (!category) throw new Error("seed missing category");

  console.log("create product...");
  const product = await createProduct({
    categoryId: category.id,
    name: "Smoke Test Bouquet",
    slug,
    description: "Untuk verifikasi admin CRUD.",
    basePrice: 250000,
    isSameDayEligible: true,
    status: "DRAFT",
  });

  console.log("update product...");
  await updateProduct({
    id: product.id,
    name: "Smoke Test Bouquet v2",
    status: "ACTIVE",
  });

  console.log("add image...");
  const image = await addProductImage({
    productId: product.id,
    url: "https://images.unsplash.com/photo-1561181286-d3fee7d55364",
    altText: "smoke",
    sortOrder: 0,
  });

  const redRose = await db.inventoryItem.findFirst({ where: { sku: "INV-RED-ROSE" } });
  const wrap = await db.inventoryItem.findFirst({ where: { sku: "INV-WRAP-STD" } });
  if (!redRose || !wrap) throw new Error("inventory missing");

  console.log("create variant with recipes...");
  const variant = await createVariantWithRecipes({
    productId: product.id,
    name: "Smoke Standard",
    size: "Small",
    color: "Mix",
    wrapper: "Standard",
    priceAdjust: 0,
    sku: `SMOKE-${stamp}-STD`,
    isActive: true,
    recipes: [
      { inventoryItemId: redRose.id, quantityNeeded: 6 },
      { inventoryItemId: wrap.id, quantityNeeded: 1 },
    ],
  });

  const addon = await db.addon.findFirst({ where: { name: "Kartu Ucapan" } });
  if (!addon) throw new Error("addon missing");
  console.log("attach + detach addon...");
  await attachAddon(product.id, addon.id);
  const afterAttach = await getProductAdminView(product.id);
  const attachedCount = afterAttach?.addons.length ?? 0;
  await detachAddon(product.id, addon.id);

  console.log("remove image...");
  await removeProductImage(image.id);

  console.log("archive product...");
  await archiveProduct(product.id);
  const after = await getProductAdminView(product.id);

  console.log(
    JSON.stringify(
      {
        productId: product.id,
        finalStatus: after?.status,
        variantCreated: variant.id,
        attachedCount,
      },
      null,
      2,
    ),
  );

  // cleanup
  await db.variantRecipe.deleteMany({ where: { variantId: variant.id } });
  await db.productVariant.delete({ where: { id: variant.id } });
  await db.productImage.deleteMany({ where: { productId: product.id } });
  await db.productAddon.deleteMany({ where: { productId: product.id } });
  await db.product.delete({ where: { id: product.id } });
}

main()
  .catch((e) => {
    console.error("ERR", e);
    process.exit(1);
  })
  .finally(() => db.$disconnect());
