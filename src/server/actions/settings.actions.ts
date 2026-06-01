"use server";

import { revalidatePath } from "next/cache";
import { requireAdmin } from "@/server/services/auth.service";
import { setSettings, SETTING_KEYS } from "@/server/services/settings.service";

const ALLOWED_KEYS = new Set<string>(Object.values(SETTING_KEYS));

export async function updateSettingsAction(formData: FormData) {
  await requireAdmin();

  const updates: Array<{ key: string; value: string }> = [];
  for (const [key, raw] of formData.entries()) {
    if (!ALLOWED_KEYS.has(key)) continue;
    const value = String(raw ?? "").trim();
    updates.push({ key, value });
  }

  if (updates.length > 0) await setSettings(updates);

  revalidatePath("/admin/settings");
  revalidatePath("/");
}
