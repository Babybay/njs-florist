"use server";

import { revalidatePath } from "next/cache";
import { headers } from "next/headers";
import { rateLimit } from "@/lib/rate-limit";
import { requireAdmin } from "@/server/services/auth.service";
import {
  createInquiry,
  updateInquiryStatus,
} from "@/server/services/inquiry.service";

export async function submitInquiryAction(formData: FormData) {
  const h = await headers();
  const ip = (h.get("x-forwarded-for") ?? "").split(",")[0]?.trim() || "unknown";
  const limit = rateLimit(`inquiry:${ip}`, { limit: 5, windowMs: 60 * 60 * 1000 });
  if (!limit.ok) {
    throw new Error("Terlalu banyak permintaan dari IP ini. Coba lagi dalam 1 jam.");
  }

  const refsRaw = String(formData.get("referenceUrls") ?? "").trim();
  const referenceUrls = refsRaw
    .split(/\s+/)
    .map((s) => s.trim())
    .filter(Boolean);

  await createInquiry({
    customerName: String(formData.get("customerName") ?? ""),
    customerEmail: String(formData.get("customerEmail") ?? ""),
    customerPhone: String(formData.get("customerPhone") ?? "") || null,
    occasion: String(formData.get("occasion") ?? "") || null,
    budget: String(formData.get("budget") ?? "") || null,
    preferredDate: String(formData.get("preferredDate") ?? "") || null,
    notes: String(formData.get("notes") ?? ""),
    referenceUrls,
  });
}

export async function updateInquiryAction(formData: FormData) {
  await requireAdmin();
  const id = String(formData.get("id") ?? "");
  const status = String(formData.get("status") ?? "");
  const note = String(formData.get("adminNote") ?? "").trim() || null;
  if (!id || !status) throw new Error("Missing fields.");
  await updateInquiryStatus(id, status, note);
  revalidatePath("/admin/inquiries");
}
