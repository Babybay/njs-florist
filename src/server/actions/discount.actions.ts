"use server";

import { revalidatePath } from "next/cache";
import { db } from "@/lib/db";
import { requireAdmin } from "@/server/services/auth.service";
import {
  createDiscountCode,
  setDiscountActive,
  updateDiscountCode,
} from "@/server/services/discount.service";

function form(formData: FormData) {
  const value = (key: string) => {
    const raw = formData.get(key);
    return raw == null ? "" : String(raw).trim();
  };
  return {
    id: value("id") || undefined,
    code: value("code"),
    type: value("type") as "PERCENT" | "FIXED",
    value_: value("value"),
    minSpend: value("minSpend") || null,
    maxUses: value("maxUses") || null,
    startsAt: value("startsAt") || null,
    endsAt: value("endsAt") || null,
    isActive: formData.get("isActive") === "on",
  };
}

export async function listDiscountCodesAction() {
  await requireAdmin();
  return db.discountCode.findMany({ orderBy: { code: "asc" } });
}

export async function createDiscountAction(formData: FormData) {
  await requireAdmin();
  const f = form(formData);
  await createDiscountCode({
    code: f.code,
    type: f.type,
    value: f.value_,
    minSpend: f.minSpend,
    maxUses: f.maxUses,
    startsAt: f.startsAt,
    endsAt: f.endsAt,
    isActive: f.isActive,
  });
  revalidatePath("/admin/discounts");
}

export async function updateDiscountAction(formData: FormData) {
  await requireAdmin();
  const f = form(formData);
  if (!f.id) throw new Error("Discount id missing.");
  await updateDiscountCode({
    id: f.id,
    code: f.code,
    type: f.type,
    value: f.value_,
    minSpend: f.minSpend,
    maxUses: f.maxUses,
    startsAt: f.startsAt,
    endsAt: f.endsAt,
    isActive: f.isActive,
  });
  revalidatePath("/admin/discounts");
}

export async function toggleDiscountAction(formData: FormData) {
  await requireAdmin();
  const id = String(formData.get("id") ?? "");
  const next = formData.get("next") === "true";
  if (!id) throw new Error("Discount id missing.");
  await setDiscountActive(id, next);
  revalidatePath("/admin/discounts");
}
