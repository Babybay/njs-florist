import { z } from "zod";

export const stockMovementInputSchema = z.object({
  inventoryItemId: z.string().min(1, "Pilih bahan baku."),
  type: z.enum(["IN", "OUT", "ADJUSTMENT", "RESERVED", "RELEASED"]),
  quantity: z.number().int("Jumlah stok harus berupa bilangan bulat.").min(0, "Jumlah stok tidak boleh negatif.").max(2147483647),
  reason: z.string().max(1000).optional(),
  orderId: z.string().optional(),
  createdById: z.string().optional(),
}).refine((input) => input.type === "ADJUSTMENT" || input.quantity > 0, { message: "Jumlah stok masuk atau keluar harus lebih dari 0.", path: ["quantity"] });

export const inventoryItemCreateSchema = z.object({
  name: z.string().min(1),
  unit: z.string().min(1),
  sku: z.string().min(1),
  currentQty: z.number().int().nonnegative().default(0),
  reorderLevel: z.number().int().nonnegative().default(0),
});

export const inventoryItemUpdateSchema = z.object({
  id: z.string().min(1),
  name: z.string().min(1).optional(),
  unit: z.string().min(1).optional(),
  sku: z.string().min(1).optional(),
  reorderLevel: z.number().int().nonnegative().optional(),
});

export const stockMovementSchema = z.object({
  inventoryItemId: z.string().min(1),
  type: z.enum(["IN", "OUT", "ADJUSTMENT"]),
  /** Positive magnitude for IN/OUT; for ADJUSTMENT this is the *target* qty (absolute). */
  quantity: z.number().int().nonnegative(),
  reason: z.string().max(200).optional(),
});
