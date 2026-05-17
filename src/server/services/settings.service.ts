import { z } from "zod";
import { db } from "@/lib/db";

export const SETTING_KEYS = {
  DELIVERY_FEE: "delivery_fee",
  SAME_DAY_CUTOFF_HOUR: "same_day_cutoff_hour",
  BUSINESS_NAME: "business_name",
  BUSINESS_PHONE: "business_phone",
  BUSINESS_EMAIL: "business_email",
  PICKUP_ADDRESS: "pickup_address",
  // Homepage highlight images (rotated from the admin dashboard).
  HOME_HERO_IMAGE: "home_hero_image",
  HOME_HERO_CAPTION: "home_hero_caption",
  HOME_PEONY_IMAGE: "home_peony_image",
  HOME_PEONY_TITLE: "home_peony_title",
  HOME_PEONY_BODY: "home_peony_body",
  HOME_PROMO_IMAGE: "home_promo_image",
  HOME_PROMO_TITLE: "home_promo_title",
  HOME_PROMO_BODY: "home_promo_body",
} as const;

export const DEFAULT_SETTINGS: Record<string, string> = {
  [SETTING_KEYS.DELIVERY_FEE]: "0",
  [SETTING_KEYS.SAME_DAY_CUTOFF_HOUR]: "14",
  [SETTING_KEYS.BUSINESS_NAME]: "njs Florist",
  [SETTING_KEYS.BUSINESS_PHONE]: "+62 812-0000-0000",
  [SETTING_KEYS.BUSINESS_EMAIL]: "halo@njsflorist.id",
  [SETTING_KEYS.PICKUP_ADDRESS]: "Jl. Sunset Road No. 88, Kuta, Bali",
  [SETTING_KEYS.HOME_HERO_IMAGE]:
    "https://images.unsplash.com/photo-1561181286-d3fee7d55364?auto=format&fit=crop&w=1800&q=85",
  [SETTING_KEYS.HOME_HERO_CAPTION]: "Peony & Garden Rose",
  [SETTING_KEYS.HOME_PEONY_IMAGE]:
    "https://images.unsplash.com/photo-1518895949257-7621c3c786d7?auto=format&fit=crop&w=2200&q=85",
  [SETTING_KEYS.HOME_PEONY_TITLE]: "Peonies",
  [SETTING_KEYS.HOME_PEONY_BODY]:
    "Musim peony hanya empat minggu setahun. Pre-order sekarang untuk pickup minggu depan, atau request varietas khusus dari farm partner kami di Bedugul.",
  [SETTING_KEYS.HOME_PROMO_IMAGE]:
    "https://images.unsplash.com/photo-1455659817273-f96807779a8a?auto=format&fit=crop&w=1800&q=85",
  [SETTING_KEYS.HOME_PROMO_TITLE]: "Forever Flower",
  [SETTING_KEYS.HOME_PROMO_BODY]:
    "Rangkaian bunga preserved dalam glass box yang bertahan hingga setahun. Cocok untuk hadiah anniversary, valentine, atau dekorasi rumah.",
};

export async function getSetting(key: string): Promise<string> {
  const row = await db.appSetting.findUnique({ where: { key } });
  return row?.value ?? DEFAULT_SETTINGS[key] ?? "";
}

export async function getSettingNumber(key: string): Promise<number> {
  const v = await getSetting(key);
  const n = Number(v);
  return Number.isFinite(n) ? n : 0;
}

export async function getAllSettings(): Promise<Record<string, string>> {
  const rows = await db.appSetting.findMany();
  const map: Record<string, string> = { ...DEFAULT_SETTINGS };
  for (const r of rows) map[r.key] = r.value;
  return map;
}

const updateSchema = z.object({
  key: z.string().min(1).max(64),
  value: z.string().max(1000),
});

export async function setSetting(input: unknown) {
  const { key, value } = updateSchema.parse(input);
  return db.appSetting.upsert({
    where: { key },
    create: { key, value },
    update: { value },
  });
}
