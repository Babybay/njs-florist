import { z } from "zod";

export const settingUpdateSchema = z.object({ key: z.string().min(1).max(64), value: z.string().max(1000) })
  .superRefine(({ key, value }, context) => {
    if (key === "same_day_cutoff_hour" && (!/^\d{1,2}$/.test(value) || Number(value) > 23)) {
      context.addIssue({ code: "custom", message: "Batas pemesanan harus berupa jam bulat 0–23 WITA.", path: ["value"] });
    }
    if (key === "delivery_fee" && (!/^\d+$/.test(value) || !Number.isSafeInteger(Number(value)) || Number(value) > 1_000_000_000)) {
      context.addIssue({ code: "custom", message: "Biaya layanan harus berupa rupiah bulat antara 0 dan 1.000.000.000.", path: ["value"] });
    }
  });
