"use server";

import { z } from "zod";
import { headers } from "next/headers";
import { rateLimit } from "@/lib/rate-limit";

const schema = z.object({
  email: z.string().email("Email tidak valid"),
});

export type NewsletterState = { ok: boolean; message: string };

export async function subscribeNewsletterAction(
  _prev: NewsletterState,
  formData: FormData,
): Promise<NewsletterState> {
  const h = await headers();
  const ip = (h.get("x-forwarded-for") ?? "").split(",")[0]?.trim() || "unknown";
  const limit = rateLimit(`newsletter:${ip}`, { limit: 5, windowMs: 60 * 60 * 1000 });
  if (!limit.ok) {
    return { ok: false, message: "Terlalu banyak permintaan. Coba lagi nanti." };
  }

  const parsed = schema.safeParse({ email: String(formData.get("email") ?? "").trim() });
  if (!parsed.success) {
    return { ok: false, message: parsed.error.issues[0]?.message ?? "Email tidak valid" };
  }

  // TODO: wire to Resend audiences / mailing list. For now, log only.
  console.log(`[newsletter] subscribe ${parsed.data.email}`);

  return { ok: true, message: "Terima kasih! Kamu akan jadi yang pertama tahu koleksi baru." };
}
