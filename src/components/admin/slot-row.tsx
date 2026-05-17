"use client";

import { useState, useTransition } from "react";
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

export function SlotRow({ slot, utilization }: { slot: Slot; utilization: { date: string; booked: number }[] }) {
  const [pending, startTransition] = useTransition();
  const [error, setError] = useState<string | null>(null);
  const [editing, setEditing] = useState(false);

  function runUpdate(formData: FormData) {
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
    <article className="rounded-lg border border-stone-200 bg-white p-5 shadow-sm">
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
            className="rounded-full border border-stone-300 px-3 py-1 text-xs font-semibold text-stone-700 hover:border-rose-300"
          >
            {editing ? "Tutup" : "Edit"}
          </button>
          <button
            type="button"
            disabled={pending}
            onClick={runToggle}
            className="rounded-full border border-stone-300 px-3 py-1 text-xs font-semibold text-stone-700 hover:border-rose-300 disabled:opacity-50"
          >
            {slot.isActive ? "Nonaktifkan" : "Aktifkan"}
          </button>
        </div>
      </div>

      {editing ? (
        <form
          action={(fd) => {
            fd.set("id", slot.id);
            runUpdate(fd);
          }}
          className="mt-4 grid gap-3 rounded-md bg-stone-50 p-3 sm:grid-cols-[1.4fr_0.6fr_0.6fr_0.6fr_auto]"
        >
          <input name="label" defaultValue={slot.label} className="rounded-md border border-stone-300 px-3 py-2 text-sm outline-none focus:border-rose-500" />
          <input name="startTime" defaultValue={slot.startTime} className="rounded-md border border-stone-300 px-3 py-2 text-sm outline-none focus:border-rose-500" />
          <input name="endTime" defaultValue={slot.endTime} className="rounded-md border border-stone-300 px-3 py-2 text-sm outline-none focus:border-rose-500" />
          <input name="capacity" type="number" min={1} defaultValue={slot.capacity} className="rounded-md border border-stone-300 px-3 py-2 text-sm outline-none focus:border-rose-500" />
          <button
            type="submit"
            disabled={pending}
            className="rounded-full bg-rose-900 px-4 py-2 text-xs font-semibold text-white hover:bg-rose-800 disabled:bg-stone-400"
          >
            {pending ? "..." : "Simpan"}
          </button>
        </form>
      ) : null}

      <div className="mt-4">
        <p className="mb-2 text-xs font-semibold uppercase tracking-wide text-stone-500">
          14 hari ke depan
        </p>
        <div className="grid grid-cols-7 gap-1 text-center text-xs">
          {utilization.map((day) => {
            const pct = slot.capacity > 0 ? day.booked / slot.capacity : 0;
            const fill =
              pct >= 1
                ? "bg-rose-200 text-rose-900"
                : pct >= 0.66
                  ? "bg-amber-100 text-amber-900"
                  : "bg-emerald-50 text-emerald-800";
            const dayLabel = new Date(day.date).toLocaleDateString("id-ID", {
              day: "numeric",
              month: "short",
            });
            return (
              <div key={day.date} className={`rounded ${fill} px-1 py-2`}>
                <p className="font-semibold">{dayLabel}</p>
                <p className="mt-0.5 text-[10px]">
                  {day.booked}/{slot.capacity}
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
