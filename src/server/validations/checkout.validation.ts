import { z } from "zod";

export const checkoutInputSchema = z.object({
  cartId: z.string().min(1),
  userId: z.string().optional(),
  storeId: z.string().min(1),
  recipient: z.object({
    name: z.string().trim().min(1, "Isi nama pengambil.").max(120, "Nama maksimal 120 karakter."),
    phone: z.string().trim().regex(/^\+?[\d\s().-]{8,25}$/, "Isi nomor WhatsApp yang valid (8–15 digit).")
      .refine((value) => { const count = value.replace(/\D/g, "").length; return count >= 8 && count <= 15; }, "Isi nomor WhatsApp yang valid (8–15 digit)."),
    senderName: z.string().trim().min(1, "Isi nama pemesan.").max(120, "Nama maksimal 120 karakter."),
    isAnonymous: z.boolean().default(false),
    cardMessage: z.string().max(300).optional(),
  }),
  delivery: z.object({
    date: z.coerce.date(),
    slotId: z.string().min(1),
    address: z.string().optional().default(""),
    notes: z.string().max(1000, "Catatan maksimal 1.000 karakter.").optional(),
  }),
  discountCode: z.string().max(64).optional(),
});
