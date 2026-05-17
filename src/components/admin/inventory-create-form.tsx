"use client";

import { useTransition, useState } from "react";
import { createInventoryItemAction } from "@/server/actions/inventory.actions";

export function InventoryCreateForm() {
  const [pending, startTransition] = useTransition();
  const [error, setError] = useState<string | null>(null);

  async function submit(formData: FormData) {
    setError(null);
    startTransition(async () => {
      try {
        await createInventoryItemAction(formData);
        const form = document.getElementById("inv-create-form") as HTMLFormElement | null;
        form?.reset();
      } catch (err) {
        setError(err instanceof Error ? err.message : "Gagal membuat item.");
      }
    });
  }

  return (
    <form
      id="inv-create-form"
      action={submit}
      className="grid gap-3 rounded-lg border border-stone-200 bg-white p-4 shadow-sm sm:grid-cols-[1.4fr_0.6fr_0.6fr_0.7fr_0.7fr_auto]"
    >
      <input name="name" required placeholder="Nama bahan" className="rounded-md border border-stone-300 px-3 py-2 text-sm outline-none focus:border-rose-500" />
      <input name="unit" required placeholder="pcs / bunches" className="rounded-md border border-stone-300 px-3 py-2 text-sm outline-none focus:border-rose-500" />
      <input name="sku" required placeholder="SKU" className="rounded-md border border-stone-300 px-3 py-2 text-sm outline-none focus:border-rose-500" />
      <input name="currentQty" type="number" min={0} defaultValue={0} placeholder="Stok awal" className="rounded-md border border-stone-300 px-3 py-2 text-sm outline-none focus:border-rose-500" />
      <input name="reorderLevel" type="number" min={0} defaultValue={0} placeholder="Reorder level" className="rounded-md border border-stone-300 px-3 py-2 text-sm outline-none focus:border-rose-500" />
      <button
        type="submit"
        disabled={pending}
        className="rounded-full bg-rose-900 px-4 py-2 text-sm font-semibold text-white hover:bg-rose-800 disabled:bg-stone-400"
      >
        {pending ? "..." : "+ Item"}
      </button>
      {error ? (
        <p className="col-span-full text-sm font-semibold text-rose-700">{error}</p>
      ) : null}
    </form>
  );
}
