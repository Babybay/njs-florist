"use client";

import { useState, useTransition } from "react";
import { createAddonAction } from "@/server/actions/addon.actions";
import { Button, inputClass } from "@/components/admin/ui";

type InventoryOption = { id: string; name: string; unit: string };

export function AddonCreateForm({ inventoryItems }: { inventoryItems: InventoryOption[] }) {
  const [pending, startTransition] = useTransition();
  const [error, setError] = useState<string | null>(null);

  function submit(formData: FormData) {
    setError(null);
    startTransition(async () => {
      try {
        await createAddonAction(formData);
        const form = document.getElementById("addon-create-form") as HTMLFormElement | null;
        form?.reset();
      } catch (err) {
        setError(err instanceof Error ? err.message : "Gagal membuat addon.");
      }
    });
  }

  return (
    <form
      id="addon-create-form"
      action={submit}
      className="grid gap-2.5 rounded-lg border border-stone-200/80 bg-white p-4 sm:grid-cols-[1.5fr_0.7fr_1fr_auto]"
    >
      <input
        name="name"
        required
        placeholder="Nama add-on (mis. Coklat batangan)"
        className={inputClass()}
      />
      <input
        name="price"
        type="number"
        min={0}
        required
        placeholder="Harga (IDR)"
        className={inputClass()}
      />
      <select name="stockItemId" className={inputClass()}>
        <option value="">Tanpa stok terkait</option>
        {inventoryItems.map((item) => (
          <option key={item.id} value={item.id}>
            {item.name} ({item.unit})
          </option>
        ))}
      </select>
      <Button type="submit" disabled={pending} variant="primary">
        {pending ? "..." : "+ Add-on"}
      </Button>
      <label className="flex items-center gap-2 text-xs text-stone-600 sm:col-span-4">
        <input type="checkbox" name="isActive" defaultChecked />
        Aktif (langsung muncul di product detail)
      </label>
      {error ? <p className="text-xs font-medium text-rose-700 sm:col-span-4">{error}</p> : null}
    </form>
  );
}
