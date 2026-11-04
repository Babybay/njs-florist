"use client";

import { useState, useTransition } from "react";
import { inputClass, Button } from "@/components/admin/ui";
import {
  toggleDeliverySlotAction,
  updateDeliverySlotAction,
} from "@/server/actions/delivery-slot.actions";

type Slot = {
  id: string;
  label: string;
  startTime: string;
  endTime: string;
  capacity: number;
  isActive: boolean;
};

export function SlotRow({ slot, utilization, readOnly = false }: { slot: Slot; utilization: { date: string; booked: number; capacity?: number; isActive?: boolean; isOverridden?: boolean }[]; readOnly?: boolean }) {
  const [pending, startTransition] = useTransition();
  const [error, setError] = useState<string | null>(null);
  const [editing, setEditing] = useState(false);

  function runUpdate(formData: FormData) {
    if (readOnly) return;
    setError(null);
    startTransition(async () => {
      try {
        await updateDeliverySlotAction(formData);
        setEditing(false);
      } catch (err) {
        setError(err instanceof Error ? err.message : "Gagal menyimpan slot.");
      }
    });
  }

  function runToggle() {
    if (readOnly) return;
    setError(null);
    const fd = new FormData();
    fd.set("id", slot.id);
    fd.set("next", String(!slot.isActive));
    startTransition(async () => {
      try {
        await toggleDeliverySlotAction(fd);
      } catch (err) {
        setError(err instanceof Error ? err.message : "Gagal toggle slot.");
      }
    });
  }

  return (
    <article className="rounded-lg border border-stone-200 bg-white p-5">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <div className="flex items-center gap-3">
            <p className="font-semibold text-stone-950">{slot.label}</p>
            <span
              className={`rounded-full px-2 py-0.5 text-xs font-semibold ${
                slot.isActive ? "bg-emerald-50 text-emerald-700" : "bg-stone-100 text-stone-500"
              }`}
            >
              {slot.isActive ? "Aktif" : "Nonaktif"}
            </span>
          </div>
          <p className="mt-1 text-sm text-stone-600">
            {slot.startTime} – {slot.endTime} · Kapasitas {slot.capacity}/hari
          </p>
        </div>
        <div className="flex flex-wrap gap-2">
          <button
            type="button"
            onClick={() => setEditing(!editing)}
            className="min-h-11 rounded-md border border-stone-300 px-3 py-2 text-sm font-semibold text-stone-700 hover:border-rose-300"
          >
            {editing ? "Tutup" : "Edit"}
          </button>
          <button
            type="button"
            disabled={pending || readOnly}
            onClick={runToggle}
            className="min-h-11 rounded-md border border-stone-300 px-3 py-2 text-sm font-semibold text-stone-700 hover:border-rose-300 disabled:opacity-50"
          >
            {slot.isActive ? "Nonaktifkan" : "Aktifkan"}
          </button>
        </div>
      </div>

      {editing ? (
        <form
          aria-label={`Edit slot ${slot.label}`}
          action={(fd) => {
            fd.set("id", slot.id);
            runUpdate(fd);
          }}
          className="mt-4 grid gap-3 rounded-md bg-stone-50 p-4 sm:grid-cols-2"
        >
          <label className="grid gap-1.5 text-sm">Nama slot<input name="label" required maxLength={60} defaultValue={slot.label} className={inputClass()} /></label>
          <label className="grid gap-1.5 text-sm">Kapasitas per hari<input name="capacity" type="number" required min={1} max={500} step={1} defaultValue={slot.capacity} className={inputClass()} /></label>
          <label className="grid gap-1.5 text-sm">Mulai (WITA)<input name="startTime" type="time" required defaultValue={slot.startTime} className={inputClass()} /></label>
          <label className="grid gap-1.5 text-sm">Selesai (WITA)<input name="endTime" type="time" required defaultValue={slot.endTime} className={inputClass()} /></label>
          <Button type="submit" disabled={pending || readOnly}>{pending ? "Menyimpan…" : "Simpan slot"}</Button>
        </form>
      ) : null}

      <div className="mt-4">
        <p className="mb-2 text-xs font-semibold uppercase tracking-wide text-stone-500">
          14 hari ke depan
        </p>
        <div className="grid grid-cols-7 gap-1 text-center text-xs">
          {utilization.map((day) => {
            const capacity = day.capacity ?? slot.capacity;
            const active = (day.isActive ?? slot.isActive) && capacity > 0;
            const pct = capacity > 0 ? day.booked / capacity : 0;
            const fill =
              !active ? "bg-stone-100 text-stone-600" : pct >= 1
                ? "bg-rose-200 text-rose-900"
                : pct >= 0.66
                  ? "bg-amber-100 text-amber-900"
                  : "bg-emerald-50 text-emerald-800";
            const dayLabel = new Date(day.date).toLocaleDateString("id-ID", {
              timeZone: "Asia/Makassar",
              day: "numeric",
              month: "short",
            });
            return (
              <div key={day.date} title={`${dayLabel}: ${day.booked} pesanan, kapasitas ${capacity}${!active ? ", tutup" : ""}${day.isOverridden ? ", pengaturan khusus" : ""}`} className={`rounded ${fill} px-1 py-2`}>
                <p className="font-semibold">{dayLabel}</p>
                <p className="mt-0.5 text-[10px]">
                  {!active ? `Tutup · ${day.booked}` : `${day.booked}/${capacity}`}
                </p>
              </div>
            );
          })}
        </div>
      </div>

      {error ? <p className="mt-3 text-sm font-semibold text-rose-700">{error}</p> : null}
    </article>
  );
}
