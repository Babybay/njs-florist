import { z } from "zod";
import { db } from "@/lib/db";

export const inquiryCreateSchema = z.object({
  customerName: z.string().trim().min(2).max(120),
  customerEmail: z.string().trim().email(),
  customerPhone: z.string().trim().max(40).optional().nullable(),
  occasion: z.string().trim().max(80).optional().nullable(),
  budget: z.coerce.number().int().min(0).optional().nullable(),
  preferredDate: z.coerce.date().optional().nullable(),
  notes: z.string().trim().min(5).max(2000),
  referenceUrls: z.array(z.string().trim().url()).max(6).optional().default([]),
});

export type InquiryCreateInput = z.input<typeof inquiryCreateSchema>;

export async function createInquiry(input: unknown) {
  const parsed = inquiryCreateSchema.parse(input);
  return db.customInquiry.create({
    data: {
      customerName: parsed.customerName,
      customerEmail: parsed.customerEmail,
      customerPhone: parsed.customerPhone ?? null,
      occasion: parsed.occasion ?? null,
      budget: parsed.budget ?? null,
      preferredDate: parsed.preferredDate ?? null,
      notes: parsed.notes,
      referenceUrls: parsed.referenceUrls ?? [],
    },
  });
}

export async function listInquiries() {
  return db.customInquiry.findMany({ orderBy: { createdAt: "desc" } });
}

export async function updateInquiryStatus(id: string, status: string, adminNote?: string | null) {
  return db.customInquiry.update({
    where: { id },
    data: {
      status: status as "NEW" | "CONTACTED" | "QUOTED" | "WON" | "LOST",
      adminNote: adminNote ?? undefined,
    },
  });
}
