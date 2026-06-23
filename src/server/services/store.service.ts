import { z } from "zod";
import { db } from "@/lib/db";

export const storeInputSchema = z.object({
  name: z.string().min(1, "Nama toko wajib diisi.").max(120),
  address: z.string().min(1, "Alamat toko wajib diisi.").max(500),
  phone: z.string().max(40).optional().or(z.literal("")),
  mapsUrl: z.string().max(500).optional().or(z.literal("")),
  sortOrder: z.coerce.number().int().min(0).optional(),
  isActive: z.boolean().optional(),
});

function normalize(input: z.infer<typeof storeInputSchema>) {
  return {
    name: input.name,
    address: input.address,
    phone: input.phone ? input.phone : null,
    mapsUrl: input.mapsUrl ? input.mapsUrl : null,
    sortOrder: input.sortOrder ?? 0,
    isActive: input.isActive ?? true,
  };
}

export function listStores() {
  return db.store.findMany({ orderBy: { sortOrder: "asc" } });
}

export function listActiveStores() {
  return db.store.findMany({ where: { isActive: true }, orderBy: { sortOrder: "asc" } });
}

export function getStore(id: string) {
  return db.store.findUnique({ where: { id } });
}

export async function createStore(input: unknown) {
  const data = normalize(storeInputSchema.parse(input));
  return db.store.create({ data });
}

export async function updateStore(id: string, input: unknown) {
  const data = normalize(storeInputSchema.parse(input));
  return db.store.update({ where: { id }, data });
}

export function setStoreActive(id: string, isActive: boolean) {
  return db.store.update({ where: { id }, data: { isActive } });
}
