"use server";

import { revalidatePath } from "next/cache";
import { requireAdmin } from "@/server/services/auth.service";
import { setSettings, SETTING_KEYS } from "@/server/services/settings.service";

const ALLOWED_HOMEPAGE_KEYS = new Set<string>([
  SETTING_KEYS.HOME_HERO_IMAGE,
  SETTING_KEYS.HOME_HERO_CAPTION,
  SETTING_KEYS.HOME_PEONY_IMAGE,
  SETTING_KEYS.HOME_PEONY_TITLE,
  SETTING_KEYS.HOME_PEONY_BODY,
  SETTING_KEYS.HOME_PROMO_IMAGE,
  SETTING_KEYS.HOME_PROMO_TITLE,
  SETTING_KEYS.HOME_PROMO_BODY,
]);

export async function updateHomepageSlotAction(payload: Record<string, string>) {
  await requireAdmin();

  const updates: Array<{ key: string; value: string }> = [];
  for (const [key, raw] of Object.entries(payload)) {
    if (!ALLOWED_HOMEPAGE_KEYS.has(key)) continue;
    updates.push({ key, value: String(raw ?? "").trim() });
  }

  if (updates.length > 0) await setSettings(updates);

  revalidatePath("/");
  revalidatePath("/admin/homepage");
}
