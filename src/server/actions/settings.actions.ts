"use server";

import { revalidatePath } from "next/cache";
import { requireAdmin } from "@/server/services/auth.service";
import { setSetting, SETTING_KEYS } from "@/server/services/settings.service";

const ALLOWED_KEYS = new Set<string>(Object.values(SETTING_KEYS));

export async function updateSettingsAction(formData: FormData) {
  await requireAdmin();

  for (const [key, raw] of formData.entries()) {
    if (!ALLOWED_KEYS.has(key)) continue;
    const value = String(raw ?? "").trim();
    await setSetting({ key, value });
  }

  revalidatePath("/admin/settings");
  revalidatePath("/");
}
