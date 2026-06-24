import { PrismaClient } from "@prisma/client";

const db = new PrismaClient();

type CategorySeed = {
  name: string;
  slug: string;
  description: string;
};

type AddonSeed = {
  name: string;
  price: number;
  stockKey?: string;
};

type InventorySeed = {
  key: string;
  name: string;
  unit: string;
  sku: string;
  currentQty: number;
  reorderLevel: number;
};

type VariantSeed = {
  name: string;
  size: string;
  color?: string;
  wrapper: string;
  priceAdjust: number;
  sku: string;
  recipe: Array<{ key: string; quantityNeeded: number }>;
};

type ProductSeed = {
  name: string;
  slug: string;
  categorySlug: string;
  description: string;
  basePrice: number;
  isSameDayEligible: boolean;
  imageUrl: string;
  imageAlt: string;
  variants: VariantSeed[];
  addons: string[];
};

type SlotSeed = {
  label: string;
  startTime: string;
  endTime: string;
  capacity: number;
};

const categories: CategorySeed[] = [
  {
    name: "Bunga Ulang Tahun",
    slug: "ulang-tahun",
    description:
      "Buket cerah untuk kejutan ulang tahun, ucapan hangat, dan momen pribadi.",
  },
  {
    name: "Bunga Pernikahan",
    slug: "pernikahan",
    description:
      "Hand bouquet, meja akad, dan rangkaian lembut untuk acara pernikahan.",
  },
  {
    name: "Bunga Duka Cita",
    slug: "duka-cita",
    description: "Rangkaian simpati yang tenang, rapi, dan siap dikirim tepat waktu.",
  },
  {
    name: "Flower Box",
    slug: "flower-box",
    description:
      "Kotak bunga premium untuk hadiah yang terlihat penuh dan tahan rapi.",
  },
];

const addons: AddonSeed[] = [
  { name: "Kartu Ucapan", price: 15000, stockKey: "greeting-card" },
  { name: "Vas Kaca", price: 75000, stockKey: "glass-vase" },
  { name: "Coklat", price: 50000, stockKey: "chocolate" },
  { name: "Teddy Bear", price: 90000, stockKey: "teddy-bear" },
];

const inventoryItems: InventorySeed[] = [
  { key: "red-rose", name: "Red Rose Stem", unit: "pcs", sku: "INV-RED-ROSE", currentQty: 300, reorderLevel: 50 },
  { key: "white-rose", name: "White Rose Stem", unit: "pcs", sku: "INV-WHITE-ROSE", currentQty: 240, reorderLevel: 40 },
  { key: "pink-rose", name: "Pink Rose Stem", unit: "pcs", sku: "INV-PINK-ROSE", currentQty: 180, reorderLevel: 30 },
  { key: "peony", name: "Peony Stem", unit: "pcs", sku: "INV-PEONY", currentQty: 80, reorderLevel: 20 },
  { key: "eucalyptus", name: "Eucalyptus", unit: "bunches", sku: "INV-EUCALYPTUS", currentQty: 60, reorderLevel: 10 },
  { key: "baby-breath", name: "Baby Breath", unit: "bunches", sku: "INV-BABY-BREATH", currentQty: 40, reorderLevel: 8 },
  { key: "wrapper-std", name: "Standard Wrapper", unit: "pcs", sku: "INV-WRAP-STD", currentQty: 200, reorderLevel: 30 },
  { key: "wrapper-premium", name: "Premium Wrapper", unit: "pcs", sku: "INV-WRAP-PREMIUM", currentQty: 100, reorderLevel: 20 },
  { key: "ribbon", name: "Ribbon", unit: "pcs", sku: "INV-RIBBON", currentQty: 150, reorderLevel: 25 },
  { key: "satin-ribbon", name: "Satin Ribbon", unit: "pcs", sku: "INV-SATIN", currentQty: 80, reorderLevel: 15 },
  { key: "standing-frame", name: "Standing Frame", unit: "pcs", sku: "INV-FRAME", currentQty: 25, reorderLevel: 5 },
  { key: "box-regular", name: "Hard Box - Regular", unit: "pcs", sku: "INV-BOX-REG", currentQty: 30, reorderLevel: 8 },
  { key: "box-large", name: "Hard Box - Large", unit: "pcs", sku: "INV-BOX-LRG", currentQty: 15, reorderLevel: 5 },
  { key: "greeting-card", name: "Greeting Card", unit: "pcs", sku: "INV-CARD", currentQty: 200, reorderLevel: 30 },
  { key: "glass-vase", name: "Glass Vase", unit: "pcs", sku: "INV-VASE", currentQty: 30, reorderLevel: 6 },
  { key: "chocolate", name: "Chocolate", unit: "pcs", sku: "INV-CHOC", currentQty: 50, reorderLevel: 10 },
  { key: "teddy-bear", name: "Teddy Bear", unit: "pcs", sku: "INV-TEDDY", currentQty: 30, reorderLevel: 5 },
];

const products: ProductSeed[] = [
  {
    name: "Romantic Mawar Merah",
    slug: "romantic-mawar-merah",
    categorySlug: "ulang-tahun",
    description:
      "Mawar merah segar dipadu baby breath, wrapper premium, pita, dan water tube untuk pengiriman same-day di Bali.",
    basePrice: 350000,
    isSameDayEligible: true,
    imageUrl:
      "https://images.unsplash.com/photo-1561181286-d3fee7d55364?auto=format&fit=crop&w=1200&q=80",
    imageAlt: "Buket mawar merah",
    variants: [
      {
        name: "Small / Standard",
        size: "Small",
        color: "Merah",
        wrapper: "Standard",
        priceAdjust: 0,
        sku: "ROSE-RED-S-STD",
        recipe: [
          { key: "red-rose", quantityNeeded: 12 },
          { key: "baby-breath", quantityNeeded: 2 },
          { key: "wrapper-std", quantityNeeded: 1 },
          { key: "ribbon", quantityNeeded: 1 },
        ],
      },
      {
        name: "Medium / Premium",
        size: "Medium",
        color: "Merah",
        wrapper: "Premium",
        priceAdjust: 150000,
        sku: "ROSE-RED-M-PREM",
        recipe: [
          { key: "red-rose", quantityNeeded: 24 },
          { key: "baby-breath", quantityNeeded: 3 },
          { key: "wrapper-premium", quantityNeeded: 1 },
          { key: "ribbon", quantityNeeded: 1 },
        ],
      },
      {
        name: "Large / Premium",
        size: "Large",
        color: "Merah",
        wrapper: "Premium",
        priceAdjust: 300000,
        sku: "ROSE-RED-L-PREM",
        recipe: [
          { key: "red-rose", quantityNeeded: 36 },
          { key: "baby-breath", quantityNeeded: 4 },
          { key: "wrapper-premium", quantityNeeded: 1 },
          { key: "ribbon", quantityNeeded: 2 },
        ],
      },
    ],
    addons: ["Kartu Ucapan", "Vas Kaca", "Coklat", "Teddy Bear"],
  },
  {
    name: "Peony Blush Box",
    slug: "peony-blush-box",
    categorySlug: "flower-box",
    description:
      "Flower box bernuansa blush dengan peony, mawar pink, dan filler putih untuk hadiah premium.",
    basePrice: 575000,
    isSameDayEligible: false,
    imageUrl:
      "https://images.unsplash.com/photo-1525310072745-f49212b5ac6d?auto=format&fit=crop&w=1200&q=80",
    imageAlt: "Flower box bernuansa merah muda",
    variants: [
      {
        name: "Regular Box",
        size: "Regular",
        color: "Blush",
        wrapper: "Hard box",
        priceAdjust: 0,
        sku: "PEONY-BLUSH-REG",
        recipe: [
          { key: "peony", quantityNeeded: 8 },
          { key: "pink-rose", quantityNeeded: 6 },
          { key: "box-regular", quantityNeeded: 1 },
        ],
      },
      {
        name: "Large Box",
        size: "Large",
        color: "Blush",
        wrapper: "Hard box",
        priceAdjust: 225000,
        sku: "PEONY-BLUSH-LRG",
        recipe: [
          { key: "peony", quantityNeeded: 12 },
          { key: "pink-rose", quantityNeeded: 12 },
          { key: "box-large", quantityNeeded: 1 },
        ],
      },
    ],
    addons: ["Kartu Ucapan", "Vas Kaca", "Coklat", "Teddy Bear"],
  },
  {
    name: "Ivory Wedding Hand Bouquet",
    slug: "ivory-wedding-hand-bouquet",
    categorySlug: "pernikahan",
    description:
      "Hand bouquet pernikahan dengan mawar putih, eucalyptus, dan pita satin untuk tampilan bersih elegan.",
    basePrice: 850000,
    isSameDayEligible: false,
    imageUrl:
      "https://images.unsplash.com/photo-1521543832500-49e0e6d9176f?auto=format&fit=crop&w=1200&q=80",
    imageAlt: "Hand bouquet pernikahan putih",
    variants: [
      {
        name: "Bride",
        size: "Bride",
        color: "Putih",
        wrapper: "Satin",
        priceAdjust: 0,
        sku: "WED-IVORY-BRIDE",
        recipe: [
          { key: "white-rose", quantityNeeded: 16 },
          { key: "eucalyptus", quantityNeeded: 4 },
          { key: "satin-ribbon", quantityNeeded: 1 },
        ],
      },
      {
        name: "Bride + Bridesmaid",
        size: "Bundle",
        color: "Putih",
        wrapper: "Satin",
        priceAdjust: 450000,
        sku: "WED-IVORY-BUNDLE",
        recipe: [
          { key: "white-rose", quantityNeeded: 32 },
          { key: "eucalyptus", quantityNeeded: 8 },
          { key: "satin-ribbon", quantityNeeded: 2 },
        ],
      },
    ],
    addons: ["Kartu Ucapan", "Vas Kaca"],
  },
  {
    name: "White Serenity Standing Flower",
    slug: "white-serenity-standing-flower",
    categorySlug: "duka-cita",
    description:
      "Standing flower putih dengan komposisi formal untuk ucapan belasungkawa dan pengiriman terjadwal.",
    basePrice: 950000,
    isSameDayEligible: true,
    imageUrl:
      "https://images.unsplash.com/photo-1487530811176-3780de880c2d?auto=format&fit=crop&w=1200&q=80",
    imageAlt: "Rangkaian bunga putih",
    variants: [
      {
        name: "Single Board",
        size: "Single",
        color: "Putih",
        wrapper: "Standing frame",
        priceAdjust: 0,
        sku: "SYMP-WHITE-SINGLE",
        recipe: [
          { key: "white-rose", quantityNeeded: 30 },
          { key: "eucalyptus", quantityNeeded: 5 },
          { key: "standing-frame", quantityNeeded: 1 },
        ],
      },
      {
        name: "Double Board",
        size: "Double",
        color: "Putih",
        wrapper: "Standing frame",
        priceAdjust: 650000,
        sku: "SYMP-WHITE-DOUBLE",
        recipe: [
          { key: "white-rose", quantityNeeded: 60 },
          { key: "eucalyptus", quantityNeeded: 10 },
          { key: "standing-frame", quantityNeeded: 2 },
        ],
      },
    ],
    addons: ["Kartu Ucapan"],
  },
];

const slots: SlotSeed[] = [
  { label: "09:00 - 11:00", startTime: "09:00", endTime: "11:00", capacity: 8 },
  { label: "11:00 - 13:00", startTime: "11:00", endTime: "13:00", capacity: 8 },
  { label: "13:00 - 15:00", startTime: "13:00", endTime: "15:00", capacity: 8 },
  { label: "15:00 - 17:00", startTime: "15:00", endTime: "17:00", capacity: 8 },
  { label: "17:00 - 19:00", startTime: "17:00", endTime: "19:00", capacity: 6 },
];

async function main() {
  console.log("Seeding stores...");
  await db.store.upsert({
    where: { id: "store_seed_1" },
    update: {},
    create: {
      id: "store_seed_1",
      name: "njs Florist — Denpasar",
      address: "Denpasar, Bali — ubah alamat lengkap di Pengaturan",
      sortOrder: 0,
      isActive: true,
    },
  });
  await db.store.upsert({
    where: { id: "store_seed_2" },
    update: {},
    create: {
      id: "store_seed_2",
      name: "njs Florist — Dalung",
      address: "Dalung, Bali — ubah alamat lengkap di Pengaturan",
      sortOrder: 1,
      isActive: true,
    },
  });

  console.log("Seeding categories...");
  const categoryByslug = new Map<string, string>();
  for (const c of categories) {
    const row = await db.category.upsert({
      where: { slug: c.slug },
      update: { name: c.name },
      create: c,
    });
    categoryByslug.set(c.slug, row.id);
  }

  console.log("Seeding inventory items...");
  const inventoryByKey = new Map<string, string>();
  for (const item of inventoryItems) {
    const row = await db.inventoryItem.upsert({
      where: { sku: item.sku },
      update: {
        name: item.name,
        unit: item.unit,
        reorderLevel: item.reorderLevel,
      },
      create: {
        name: item.name,
        unit: item.unit,
        sku: item.sku,
        currentQty: item.currentQty,
        reorderLevel: item.reorderLevel,
      },
    });
    inventoryByKey.set(item.key, row.id);
  }

  console.log("Seeding addons...");
  const addonByName = new Map<string, string>();
  for (const addon of addons) {
    const stockItemId = addon.stockKey ? inventoryByKey.get(addon.stockKey) ?? null : null;
    // Addon has no unique field on name; do a find-or-create dance.
    const existing = await db.addon.findFirst({ where: { name: addon.name } });
    const row = existing
      ? await db.addon.update({
          where: { id: existing.id },
          data: { price: addon.price, stockItemId },
        })
      : await db.addon.create({
          data: { name: addon.name, price: addon.price, stockItemId },
        });
    addonByName.set(addon.name, row.id);
  }

  console.log("Seeding products, variants, recipes, addon attachments, images...");
  for (const p of products) {
    const categoryId = categoryByslug.get(p.categorySlug);
    if (!categoryId) throw new Error(`Missing category ${p.categorySlug}`);

    const product = await db.product.upsert({
      where: { slug: p.slug },
      update: {
        name: p.name,
        description: p.description,
        basePrice: p.basePrice,
        isSameDayEligible: p.isSameDayEligible,
        status: "ACTIVE",
        categoryId,
      },
      create: {
        name: p.name,
        slug: p.slug,
        description: p.description,
        basePrice: p.basePrice,
        isSameDayEligible: p.isSameDayEligible,
        status: "ACTIVE",
        categoryId,
      },
    });

    // Product image (single, idempotent on url).
    const existingImage = await db.productImage.findFirst({
      where: { productId: product.id, url: p.imageUrl },
    });
    if (!existingImage) {
      await db.productImage.create({
        data: { productId: product.id, url: p.imageUrl, altText: p.imageAlt, sortOrder: 0 },
      });
    }

    for (const v of p.variants) {
      const variant = await db.productVariant.upsert({
        where: { sku: v.sku },
        update: {
          name: v.name,
          size: v.size,
          color: v.color,
          wrapper: v.wrapper,
          priceAdjust: v.priceAdjust,
          isActive: true,
          productId: product.id,
        },
        create: {
          productId: product.id,
          name: v.name,
          size: v.size,
          color: v.color,
          wrapper: v.wrapper,
          priceAdjust: v.priceAdjust,
          sku: v.sku,
          isActive: true,
        },
      });

      for (const r of v.recipe) {
        const inventoryItemId = inventoryByKey.get(r.key);
        if (!inventoryItemId) throw new Error(`Missing inventory ${r.key}`);
        await db.variantRecipe.upsert({
          where: {
            variantId_inventoryItemId: {
              variantId: variant.id,
              inventoryItemId,
            },
          },
          update: { quantityNeeded: r.quantityNeeded },
          create: {
            variantId: variant.id,
            inventoryItemId,
            quantityNeeded: r.quantityNeeded,
          },
        });
      }
    }

    for (const addonName of p.addons) {
      const addonId = addonByName.get(addonName);
      if (!addonId) throw new Error(`Missing addon ${addonName}`);
      await db.productAddon.upsert({
        where: { productId_addonId: { productId: product.id, addonId } },
        update: {},
        create: { productId: product.id, addonId },
      });
    }
  }

  console.log("Seeding delivery slots...");
  for (const s of slots) {
    const existing = await db.deliverySlot.findFirst({ where: { label: s.label } });
    if (existing) {
      await db.deliverySlot.update({
        where: { id: existing.id },
        data: { capacity: s.capacity, startTime: s.startTime, endTime: s.endTime, isActive: true },
      });
    } else {
      await db.deliverySlot.create({ data: { ...s, storeId: "store_seed_1", isActive: true } });
    }
  }

  console.log("Done.");
}

main()
  .catch((error) => {
    console.error(error);
    process.exit(1);
  })
  .finally(async () => {
    await db.$disconnect();
  });
