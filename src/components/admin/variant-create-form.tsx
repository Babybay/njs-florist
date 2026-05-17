"use client";

import { useState, useTransition } from "react";
import { createVariantAction } from "@/server/actions/variant.actions";

type InventoryOption = {
  id: string;
  name: string;
  unit: string;
};

type RecipeRow = {
  key: number;
  inventoryItemId: string;
  quantityNeeded: number;
};

export function VariantCreateForm({
  productId,
  inventoryOptions,
}: {
  productId: string;
  inventoryOptions: InventoryOption[];
}) {
  const [rows, setRows] = useState<RecipeRow[]>([{ key: 1, inventoryItemId: "", quantityNeeded: 1 }]);
  const [pending, startTransition] = useTransition();
  const [error, setError] = useState<string | null>(null);

  function addRow() {
    setRows((prev) => [...prev, { key: Date.now(), inventoryItemId: "", quantityNeeded: 1 }]);
  }

  function removeRow(key: number) {
    setRows((prev) => prev.filter((row) => row.key !== key));
  }

  function updateRow(key: number, patch: Partial<RecipeRow>) {
    setRows((prev) => prev.map((row) => (row.key === key ? { ...row, ...patch } : row)));
  }

  async function submit(formData: FormData) {
    setError(null);
    for (const row of rows) {
      if (row.inventoryItemId && row.quantityNeeded > 0) {
        formData.append("recipeInventoryItemId", row.inventoryItemId);
        formData.append("recipeQuantityNeeded", String(row.quantityNeeded));
      }
    }
    startTransition(async () => {
      try {
        await createVariantAction(formData);
        setRows([{ key: Date.now(), inventoryItemId: "", quantityNeeded: 1 }]);
        // Reset form fields by full reload — revalidatePath inside action refreshes the list.
      } catch (err) {
        setError(err instanceof Error ? err.message : "Gagal membuat varian.");
      }
    });
  }

  return (
    <form action={submit} className="grid gap-4 rounded-lg border border-stone-200 bg-white p-5 shadow-sm">
      <input type="hidden" name="productId" value={productId} />
      <h3 className="text-lg font-semibold text-stone-950">Tambah varian</h3>
      <div className="grid gap-4 sm:grid-cols-2">
        <label className="grid gap-2 text-sm font-semibold text-stone-800">
          Nama varian *
          <input
            name="name"
            required
            className="rounded-md border border-stone-300 px-3 py-2 font-normal outline-none focus:border-rose-500"
          />
        </label>
        <label className="grid gap-2 text-sm font-semibold text-stone-800">
          SKU *
          <input
            name="sku"
            required
            className="rounded-md border border-stone-300 px-3 py-2 font-normal outline-none focus:border-rose-500"
          />
        </label>
        <label className="grid gap-2 text-sm font-semibold text-stone-800">
          Size
          <input
            name="size"
            className="rounded-md border border-stone-300 px-3 py-2 font-normal outline-none focus:border-rose-500"
          />
        </label>
        <label className="grid gap-2 text-sm font-semibold text-stone-800">
          Color
          <input
            name="color"
            className="rounded-md border border-stone-300 px-3 py-2 font-normal outline-none focus:border-rose-500"
          />
        </label>
        <label className="grid gap-2 text-sm font-semibold text-stone-800">
          Wrapper
          <input
            name="wrapper"
            className="rounded-md border border-stone-300 px-3 py-2 font-normal outline-none focus:border-rose-500"
          />
        </label>
        <label className="grid gap-2 text-sm font-semibold text-stone-800">
          Price adjust (IDR)
          <input
            type="number"
            name="priceAdjust"
            defaultValue={0}
            className="rounded-md border border-stone-300 px-3 py-2 font-normal outline-none focus:border-rose-500"
          />
        </label>
      </div>

      <div className="grid gap-3">
        <div className="flex items-center justify-between">
          <p className="text-sm font-semibold text-stone-800">Recipe bahan baku</p>
          <button
            type="button"
            onClick={addRow}
            className="rounded-full border border-stone-300 px-3 py-1 text-xs font-semibold text-stone-700 hover:border-rose-300"
          >
            + Tambah baris
          </button>
        </div>
        {rows.map((row) => (
          <div key={row.key} className="grid gap-2 sm:grid-cols-[1fr_120px_auto]">
            <select
              value={row.inventoryItemId}
              onChange={(event) => updateRow(row.key, { inventoryItemId: event.target.value })}
              className="rounded-md border border-stone-300 px-3 py-2 text-sm outline-none focus:border-rose-500"
            >
              <option value="">Pilih bahan</option>
              {inventoryOptions.map((option) => (
                <option key={option.id} value={option.id}>
                  {option.name} ({option.unit})
                </option>
              ))}
            </select>
            <input
              type="number"
              min={1}
              value={row.quantityNeeded}
              onChange={(event) =>
                updateRow(row.key, { quantityNeeded: Math.max(1, Number(event.target.value) || 1) })
              }
              className="rounded-md border border-stone-300 px-3 py-2 text-sm outline-none focus:border-rose-500"
            />
            <button
              type="button"
              onClick={() => removeRow(row.key)}
              className="rounded-md px-3 py-2 text-xs font-semibold text-rose-700 hover:bg-rose-50"
            >
              Hapus
            </button>
          </div>
        ))}
      </div>

      {error ? <p className="text-sm font-semibold text-rose-700">{error}</p> : null}

      <button
        type="submit"
        disabled={pending}
        className="self-start rounded-full bg-rose-900 px-5 py-2 text-sm font-semibold text-white transition hover:bg-rose-800 disabled:bg-stone-400"
      >
        {pending ? "Menyimpan..." : "Tambah varian"}
      </button>
    </form>
  );
}
