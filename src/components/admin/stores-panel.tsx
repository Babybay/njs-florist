"use client";

import { useTransition } from "react";
import { Button, inputClass } from "@/components/admin/ui";
import {
  createStoreAction,
  updateStoreAction,
  toggleStoreActiveAction,
} from "@/server/actions/store.actions";

type Store = {
  id: string;
  name: string;
  address: string;
  phone: string | null;
  mapsUrl: string | null;
  sortOrder: number;
  isActive: boolean;
};

export function StoresPanel({ stores }: { stores: Store[] }) {
  const [pending, startTransition] = useTransition();

  return (
    <div className="grid gap-4 rounded-lg border border-stone-200/80 bg-white p-5">
      <p className="text-[11px] font-semibold uppercase tracking-wider text-stone-500">
        Toko pickup
      </p>

      {stores.map((store) => (
        <form
          key={store.id}
          action={(fd) => startTransition(() => updateStoreAction(store.id, fd))}
          className="grid gap-2 rounded-md border border-stone-200 p-3"
        >
          <div className="grid gap-2 sm:grid-cols-2">
            <input name="name" defaultValue={store.name} placeholder="Nama toko" className={inputClass()} />
            <input name="phone" defaultValue={store.phone ?? ""} placeholder="Telepon (opsional)" className={inputClass()} />
          </div>
          <input name="address" defaultValue={store.address} placeholder="Alamat" className={inputClass()} />
          <input name="mapsUrl" defaultValue={store.mapsUrl ?? ""} placeholder="Link Google Maps (opsional)" className={inputClass()} />
          <div className="grid gap-2 sm:grid-cols-[120px_auto]">
            <input name="sortOrder" type="number" min={0} defaultValue={store.sortOrder} placeholder="Urutan" className={inputClass()} />
            <label className="flex items-center gap-2 text-sm text-stone-700">
              <input type="checkbox" name="isActive" defaultChecked={store.isActive} className="h-4 w-4 accent-black" />
              Aktif (tampil di checkout)
            </label>
          </div>
          <div className="flex items-center gap-2">
            <Button type="submit" variant="primary" disabled={pending}>Simpan toko</Button>
            <button
              type="button"
              onClick={() => startTransition(() => toggleStoreActiveAction(store.id, !store.isActive))}
              className="text-xs font-medium text-stone-500 hover:text-stone-900"
            >
              {store.isActive ? "Nonaktifkan" : "Aktifkan"}
            </button>
          </div>
        </form>
      ))}

      <form
        action={(fd) => startTransition(() => createStoreAction(fd))}
        className="grid gap-2 rounded-md border border-dashed border-stone-300 p-3"
      >
        <p className="text-xs font-semibold text-stone-600">Tambah toko baru</p>
        <input name="name" placeholder="Nama toko" required className={inputClass()} />
        <input name="address" placeholder="Alamat" required className={inputClass()} />
        <input name="phone" placeholder="Telepon (opsional)" className={inputClass()} />
        <input name="mapsUrl" placeholder="Link Google Maps (opsional)" className={inputClass()} />
        <input name="sortOrder" type="number" min={0} defaultValue={0} className={inputClass()} />
        <label className="flex items-center gap-2 text-sm text-stone-700">
          <input type="checkbox" name="isActive" defaultChecked className="h-4 w-4 accent-black" />
          Aktif
        </label>
        <Button type="submit" disabled={pending}>Tambah toko</Button>
      </form>
    </div>
  );
}
