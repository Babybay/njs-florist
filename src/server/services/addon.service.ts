import { z } from "zod";
import { db } from "@/lib/db";

export const addonCreateSchema = z.object({
  name: z.string().trim().min(2).max(80),
  price: z.coerce.number().int().min(0).max(100_000_000),
  stockItemId: z.string().min(1).optional().nullable(),
  isActive: z.coerce.boolean().optional().default(true),
});

export const addonUpdateSchema = addonCreateSchema.partial().extend({
  id: z.string().min(1),
});

export async function createAddon(input: unknown) {
  const parsed = addonCreateSchema.parse(input);
  return db.addon.create({
    data: {
      name: parsed.name,
      price: parsed.price,
      stockItemId: parsed.stockItemId ?? null,
      isActive: parsed.isActive ?? true,
    },
  });
}

export async function updateAddon(input: unknown) {
  const parsed = addonUpdateSchema.parse(input);
  const { id, ...rest } = parsed;
  return db.addon.update({ where: { id }, data: rest });
}

export async function setAddonActive(id: string, isActive: boolean) {
  return db.addon.update({ where: { id }, data: { isActive } });
}

export async function listAddonsWithUsage() {
  const addons = await db.addon.findMany({ orderBy: { name: "asc" } });
  const usage = await db.productAddon.groupBy({
    by: ["addonId"],
    _count: true,
  });
  const map = new Map(usage.map((u) => [u.addonId, u._count]));
  return addons.map((a) => ({ ...a, productCount: map.get(a.id) ?? 0 }));
}
