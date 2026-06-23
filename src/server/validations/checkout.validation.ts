import { z } from "zod";

export const checkoutInputSchema = z.object({
  cartId: z.string().min(1),
  userId: z.string().optional(),
  storeId: z.string().min(1),
  recipient: z.object({
    name: z.string().min(1),
    phone: z.string().min(1),
    senderName: z.string().min(1),
    isAnonymous: z.boolean().default(false),
    cardMessage: z.string().max(300).optional(),
  }),
  delivery: z.object({
    date: z.coerce.date(),
    slotId: z.string().min(1),
    address: z.string().optional().default(""),
    notes: z.string().optional(),
  }),
  discountCode: z.string().optional(),
});
