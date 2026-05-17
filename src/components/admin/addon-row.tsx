"use client";

import { useState, useTransition } from "react";
import { formatIDR } from "@/lib/money";
import {
  toggleAddonAction,
  updateAddonAction,
} from "@/server/actions/addon.actions";
import { Button, inputClass, tagClass } from "@/components/admin/ui";

type Addon = {
  id: string;
  name: string;
  price: number;
  stockItemId: string | null;
  isActive: boolean;
  productCount: number;
};

type InventoryOption = { id: string; name: string; unit: string };

export function AddonRow({
  addon,
  inventoryItems,
}: {
  addon: Addon;
  inventoryItems: InventoryOption[];
}) {
  const [pending, startTransition] = useTransition();
  const [error, setError] = useState<string | null>(null);
  const [editing, setEditing] = useState(false);

  function runUpdate(formData: FormData) {
    setError(null);
    startTransition(async () => {
      try {
        await updateAddonAction(formData);
        setEditing(false);
      } catch (err) {
        setError(err instanceof Error ? err.message : "Gagal menyimpan.");
      }
    });
  }

  function runToggle() {
    const fd = new FormData();
    fd.set("id", addon.id);
    fd.set("next", String(!addon.isActive));
    startTransition(async () => {
      try {
        await toggleAddonAction(fd);
      } catch (err) {
        setError(err instanceof Error ? err.message : "Gagal toggle.");
      }
    });
  }

  const linkedItem = addon.stockItemId
    ? inventoryItems.find((i) => i.id === addon.stockItemId)
    : null;

  return (
    <article className="rounded-lg border border-stone-200/80 bg-white p-4 transition hover:border-stone-300">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div className="min-w-0">
          <div className="flex flex-wrap items-center gap-2">
            <p className="font-medium text-stone-900">{addon.name}</p>
            <span className={tagClass("rose")}>{formatIDR(addon.price)}</span>
            <span className={tagClass(addon.isActive ? "emerald" : "neutral")}>
              {addon.isActive ? "Aktif" : "Nonaktif"}
            </span>
          </div>
          <p className="mt-0.5 text-xs text-stone-500">
            {linkedItem ? `Stok: ${linkedItem.name} (${linkedItem.unit})` : "Tanpa stok terkait"}
            {" · "}
            {addon.productCount > 0
              ? `Dipakai ${addon.productCount} produk`
              : "Belum dipakai produk"}
          </p>
        </div>
        <div className="flex shrink-0 flex-wrap gap-1.5">
          <Button type="button" variant="ghost" onClick={() => setEditing(!editing)}>
            {editing ? "Tutup" : "Edit"}
          </Button>
          <Button type="button" variant="secondary" disabled={pending} onClick={runToggle}>
            {addon.isActive ? "Nonaktifkan" : "Aktifkan"}
          </Button>
        </div>
      </div>

      {editing ? (
        <form
          action={(fd) => {
            fd.set("id", addon.id);
            runUpdate(fd);
          }}
          className="mt-3 grid gap-2 rounded-md bg-stone-50/70 p-3 sm:grid-cols-[1.5fr_0.7fr_1fr]"
        >
          <input name="name" defaultValue={addon.name} className={inputClass()} />
          <input name="price" type="number" min={0} defaultValue={addon.price} className={inputClass()} />
          <select
            name="stockItemId"
            defaultValue={addon.stockItemId ?? ""}
            className={inputClass()}
          >
            <option value="">Tanpa stok terkait</option>
            {inventoryItems.map((item) => (
              <option key={item.id} value={item.id}>
                {item.name} ({item.unit})
              </option>
            ))}
          </select>
          <label className="flex items-center gap-2 text-xs text-stone-600 sm:col-span-3">
            <input type="checkbox" name="isActive" defaultChecked={addon.isActive} />
            Aktif
          </label>
          <Button type="submit" variant="primary" disabled={pending} className="sm:col-span-3">
            {pending ? "Menyimpan..." : "Simpan"}
          </Button>
        </form>
      ) : null}

      {error ? <p className="mt-2 text-xs font-medium text-rose-700">{error}</p> : null}
    </article>
  );
}
