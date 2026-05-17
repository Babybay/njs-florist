"use client";

import { useState, useTransition } from "react";
import {
  applyStockMovementAction,
  updateInventoryItemAction,
} from "@/server/actions/inventory.actions";

type Item = {
  id: string;
  name: string;
  unit: string;
  sku: string;
  currentQty: number;
  reorderLevel: number;
};

export function InventoryRow({ item }: { item: Item }) {
  const [pending, startTransition] = useTransition();
  const [error, setError] = useState<string | null>(null);
  const [editMode, setEditMode] = useState<"none" | "settings" | "in" | "out" | "set">("none");
  const low = item.reorderLevel > 0 && item.currentQty <= item.reorderLevel;

  async function runAction(action: (fd: FormData) => Promise<unknown>, fd: FormData) {
    setError(null);
    startTransition(async () => {
      try {
        await action(fd);
        setEditMode("none");
      } catch (err) {
        setError(err instanceof Error ? err.message : "Aksi gagal.");
      }
    });
  }

  return (
    <article className="rounded-lg border border-stone-200 bg-white p-5 shadow-sm">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <p className="font-semibold text-stone-950">
            {item.name}
            <span className="ml-2 text-xs font-medium uppercase tracking-wide text-stone-500">
              {item.sku}
            </span>
          </p>
          <p className="mt-1 text-sm text-stone-600">
            <span className={`font-semibold ${low ? "text-amber-700" : "text-stone-950"}`}>
              {item.currentQty} {item.unit}
            </span>
            <span className="text-stone-500"> · reorder lvl {item.reorderLevel}</span>
            {low ? <span className="ml-2 rounded-full bg-amber-100 px-2 py-0.5 text-xs font-semibold text-amber-800">LOW</span> : null}
          </p>
        </div>
        <div className="flex flex-wrap gap-2">
          <button
            onClick={() => setEditMode(editMode === "in" ? "none" : "in")}
            className="rounded-full border border-emerald-300 px-3 py-1 text-xs font-semibold text-emerald-700 hover:bg-emerald-50"
          >
            Tambah stok
          </button>
          <button
            onClick={() => setEditMode(editMode === "out" ? "none" : "out")}
            className="rounded-full border border-rose-300 px-3 py-1 text-xs font-semibold text-rose-700 hover:bg-rose-50"
          >
            Kurangi
          </button>
          <button
            onClick={() => setEditMode(editMode === "set" ? "none" : "set")}
            className="rounded-full border border-stone-300 px-3 py-1 text-xs font-semibold text-stone-700 hover:border-rose-300"
          >
            Set absolut
          </button>
          <button
            onClick={() => setEditMode(editMode === "settings" ? "none" : "settings")}
            className="rounded-full border border-stone-300 px-3 py-1 text-xs font-semibold text-stone-700 hover:border-rose-300"
          >
            Pengaturan
          </button>
        </div>
      </div>

      {editMode === "in" || editMode === "out" || editMode === "set" ? (
        <form
          action={(fd) => {
            fd.set("inventoryItemId", item.id);
            fd.set(
              "type",
              editMode === "in" ? "IN" : editMode === "out" ? "OUT" : "ADJUSTMENT",
            );
            return runAction(applyStockMovementAction, fd);
          }}
          className="mt-4 grid gap-3 rounded-md bg-stone-50 p-3 sm:grid-cols-[140px_1fr_auto]"
        >
          <input
            name="quantity"
            type="number"
            min={0}
            required
            placeholder={editMode === "set" ? "Stok baru" : "Jumlah"}
            className="rounded-md border border-stone-300 px-3 py-2 text-sm outline-none focus:border-rose-500"
          />
          <input
            name="reason"
            placeholder={
              editMode === "in"
                ? "Alasan (mis. terima supplier #INV-123)"
                : editMode === "out"
                  ? "Alasan (mis. busuk, sample)"
                  : "Alasan (mis. stock opname)"
            }
            className="rounded-md border border-stone-300 px-3 py-2 text-sm outline-none focus:border-rose-500"
          />
          <button
            type="submit"
            disabled={pending}
            className="rounded-full bg-rose-900 px-4 py-2 text-xs font-semibold text-white hover:bg-rose-800 disabled:bg-stone-400"
          >
            {pending ? "..." : "Catat"}
          </button>
        </form>
      ) : null}

      {editMode === "settings" ? (
        <form
          action={(fd) => {
            fd.set("id", item.id);
            return runAction(updateInventoryItemAction, fd);
          }}
          className="mt-4 grid gap-3 rounded-md bg-stone-50 p-3 sm:grid-cols-[1fr_140px_auto]"
        >
          <input
            name="name"
            defaultValue={item.name}
            className="rounded-md border border-stone-300 px-3 py-2 text-sm outline-none focus:border-rose-500"
          />
          <input
            name="reorderLevel"
            type="number"
            min={0}
            defaultValue={item.reorderLevel}
            className="rounded-md border border-stone-300 px-3 py-2 text-sm outline-none focus:border-rose-500"
          />
          <button
            type="submit"
            disabled={pending}
            className="rounded-full bg-rose-900 px-4 py-2 text-xs font-semibold text-white hover:bg-rose-800 disabled:bg-stone-400"
          >
            Simpan
          </button>
        </form>
      ) : null}

      {error ? <p className="mt-3 text-sm font-semibold text-rose-700">{error}</p> : null}
    </article>
  );
}
