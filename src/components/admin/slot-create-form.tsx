"use client";

import { useState, useTransition } from "react";
import { createDeliverySlotAction } from "@/server/actions/delivery-slot.actions";
import { Button, inputClass } from "@/components/admin/ui";

export function SlotCreateForm({ stores, readOnly = false, defaultStoreId }: { stores: { id: string; name: string }[]; readOnly?: boolean; defaultStoreId?: string }) {
  const [pending, startTransition] = useTransition();
  const [error, setError] = useState<string | null>(null);

  function submit(formData: FormData) {
    if (readOnly) return;
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
      className="grid gap-3 border-b border-stone-200 pb-6 sm:grid-cols-2 lg:grid-cols-3"
    >
      <label className="grid gap-1.5 text-sm font-medium">Toko pickup<select name="storeId" required defaultValue={defaultStoreId ?? stores[0]?.id ?? ""} className={inputClass()}>
        {stores.map((s) => (
          <option key={s.id} value={s.id}>{s.name}</option>
        ))}
      </select></label>
      <label className="grid gap-1.5 text-sm font-medium">Nama slot<input name="label" required maxLength={60} placeholder="Misalnya: Sore" className={inputClass()} /></label>
      <label className="grid gap-1.5 text-sm font-medium">Kapasitas per hari<input name="capacity" type="number" min={1} max={500} step={1} required placeholder="Jumlah pesanan" className={inputClass()} /></label>
      <label className="grid gap-1.5 text-sm font-medium">Mulai (WITA)<input name="startTime" type="time" required className={inputClass()} /></label>
      <label className="grid gap-1.5 text-sm font-medium">Selesai (WITA)<input name="endTime" type="time" required className={inputClass()} /></label>
      <Button type="submit" disabled={pending || readOnly || !stores.length} className="self-end">{pending ? "Menambahkan…" : "Tambah slot"}</Button>
      <p className="col-span-full text-sm leading-6 text-stone-600">Template berulang setiap hari. Gunakan kalender untuk hari libur atau kapasitas tanggal khusus.</p>
      {error ? <p role="alert" className="col-span-full text-sm font-semibold text-rose-700">{error}</p> : null}
    </form>
  );
}
