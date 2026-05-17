import { z } from "zod";

export const addToCartInputSchema = z.object({
  userId: z.string().optional(),
  sessionId: z.string().optional(),
  productId: z.string().min(1),
  variantId: z.string().min(1),
  quantity: z.number().int().positive(),
  addons: z.array(z.object({
    addonId: z.string().min(1),
    quantity: z.number().int().positive(),
  })).default([]),
  cardMessage: z.string().max(300).optional(),
});
