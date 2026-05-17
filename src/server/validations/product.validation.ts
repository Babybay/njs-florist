import { z } from "zod";

export const productInputSchema = z.object({
  categoryId: z.string().min(1),
  name: z.string().min(1),
  slug: z
    .string()
    .min(1)
    .regex(/^[a-z0-9-]+$/, "Slug hanya boleh huruf kecil, angka, dan tanda hubung."),
  description: z.string().min(1),
  basePrice: z.number().int().nonnegative(),
  isSameDayEligible: z.boolean().default(false),
  status: z.enum(["DRAFT", "ACTIVE", "ARCHIVED"]).default("DRAFT"),
});

export const productUpdateSchema = productInputSchema.partial().extend({
  id: z.string().min(1),
});

export const variantInputSchema = z.object({
  productId: z.string().min(1),
  name: z.string().min(1),
  size: z.string().optional(),
  color: z.string().optional(),
  wrapper: z.string().optional(),
  priceAdjust: z.number().int().default(0),
  sku: z.string().min(1),
  isActive: z.boolean().default(true),
  recipes: z
    .array(
      z.object({
        inventoryItemId: z.string().min(1),
        quantityNeeded: z.number().int().positive(),
      }),
    )
    .default([]),
});

export const productImageInputSchema = z.object({
  productId: z.string().min(1),
  url: z.string().url(),
  altText: z.string().optional(),
  sortOrder: z.number().int().nonnegative().default(0),
});
