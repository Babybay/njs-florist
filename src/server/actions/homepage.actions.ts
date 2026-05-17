"use server";

import { revalidatePath } from "next/cache";
import { requireAdmin } from "@/server/services/auth.service";
import { setSetting, SETTING_KEYS } from "@/server/services/settings.service";

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

  for (const [key, raw] of Object.entries(payload)) {
    if (!ALLOWED_HOMEPAGE_KEYS.has(key)) continue;
    await setSetting({ key, value: String(raw ?? "").trim() });
  }

  revalidatePath("/");
  revalidatePath("/admin/homepage");
}
