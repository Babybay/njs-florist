"use client";

import { useState, useTransition } from "react";
import { createDeliverySlotAction } from "@/server/actions/delivery-slot.actions";

export function SlotCreateForm({ stores }: { stores: { id: string; name: string }[] }) {
  const [pending, startTransition] = useTransition();
  const [error, setError] = useState<string | null>(null);

  function submit(formData: FormData) {
    setError(null);
    startTransition(async () => {
      try {
        await createDeliverySlotAction(formData);
        const form = document.getElementById("slot-create-form") as HTMLFormElement | null;
        form?.reset();
      } catch (err) {
        setError(err instanceof Error ? err.message : "Gagal membuat slot.");
      }
    });
  }

  return (
    <form
      id="slot-create-form"
      action={submit}
      className="grid gap-3 rounded-lg border border-stone-200 bg-white p-4 shadow-sm sm:grid-cols-[1fr_1.4fr_0.6fr_0.6fr_0.6fr_auto]"
    >
      <select name="storeId" required defaultValue={stores[0]?.id ?? ""} className="rounded-md border border-stone-300 px-3 py-2 text-sm outline-none focus:border-rose-500">
        {stores.map((s) => (
          <option key={s.id} value={s.id}>{s.name}</option>
        ))}
      </select>
      <input name="label" required placeholder="Label (mis. Sore 17-19)" className="rounded-md border border-stone-300 px-3 py-2 text-sm outline-none focus:border-rose-500" />
      <input name="startTime" required placeholder="HH:MM" className="rounded-md border border-stone-300 px-3 py-2 text-sm outline-none focus:border-rose-500" />
      <input name="endTime" required placeholder="HH:MM" className="rounded-md border border-stone-300 px-3 py-2 text-sm outline-none focus:border-rose-500" />
      <input name="capacity" type="number" min={1} required placeholder="Kapasitas" className="rounded-md border border-stone-300 px-3 py-2 text-sm outline-none focus:border-rose-500" />
      <button
        type="submit"
        disabled={pending}
        className="rounded-full bg-rose-900 px-4 py-2 text-sm font-semibold text-white hover:bg-rose-800 disabled:bg-stone-400"
      >
        {pending ? "..." : "+ Slot"}
      </button>
      {error ? <p className="col-span-full text-sm font-semibold text-rose-700">{error}</p> : null}
    </form>
  );
}
