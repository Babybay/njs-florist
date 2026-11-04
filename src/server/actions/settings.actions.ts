"use server";

import { revalidatePath, revalidateTag } from "next/cache";
import { requireAdmin } from "@/server/services/auth.service";
import { setSettings, SETTING_KEYS, SETTINGS_TAG } from "@/server/services/settings.service";
import { ZodError } from "zod";

const ALLOWED_KEYS = new Set<string>(Object.values(SETTING_KEYS));

export async function updateSettingsAction(formData: FormData) {
  await requireAdmin();

  const updates: Array<{ key: string; value: string }> = [];
  for (const [key, raw] of formData.entries()) {
    if (!ALLOWED_KEYS.has(key)) continue;
    const value = String(raw ?? "").trim();
    updates.push({ key, value });
  }

  try { if (updates.length > 0) await setSettings(updates); }
  catch (error) { if (error instanceof ZodError) throw new Error(error.issues[0]?.message ?? "Periksa pengaturan."); throw error; }

  revalidateTag(SETTINGS_TAG, "max");
  revalidatePath("/admin/settings");
  revalidatePath("/");
}
