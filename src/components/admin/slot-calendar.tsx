"use client";

import Link from "next/link";
import { useMemo, useState, useTransition } from "react";
import {
  upsertSlotOverrideAction,
  setStoreDayAvailabilityAction,
} from "@/server/actions/slot-override.actions";
import { Button, inputClass, tagClass } from "@/components/admin/ui";

type Slot = {
  id: string;
  label: string;
  startTime: string;
  endTime: string;
  capacity: number;
  isActive: boolean;
};

type DayCell = {
  date: string;
  booked: number;
  capacity: number;
  isActive: boolean;
  isOverridden: boolean;
  note: string | null;
  overrideCapacity?: number | null;
  overrideIsActive?: boolean | null;
};

type SlotDays = {
  slotId: string;
  label: string;
  days: DayCell[];
};

function toDate(iso: string) {
  return new Date(`${iso}T00:00:00`);
}

function isoDate(d: Date) {
  return d.toISOString().slice(0, 10);
}

function formatDayLabel(iso: string) {
  const d = toDate(iso);
  return d.toLocaleDateString("id-ID", { weekday: "long", day: "numeric", month: "long", year: "numeric" });
}

function gridStartOffset(firstIso: string) {
  // Monday-first grid
  const dow = toDate(firstIso).getDay();
  return (dow + 6) % 7;
}

function shiftMonth(monthKey: string, delta: number): string {
  const [y, m] = monthKey.split("-").map(Number);
  const d = new Date(Date.UTC(y, m - 1 + delta, 1));
  return `${d.getUTCFullYear()}-${String(d.getUTCMonth() + 1).padStart(2, "0")}`;
}

const MONTH_LABEL = [
  "Januari", "Februari", "Maret", "April", "Mei", "Juni",
  "Juli", "Agustus", "September", "Oktober", "November", "Desember",
];

export function SlotCalendar({
  slots,
  utilization,
  monthKey,
  todayIso,
  storeId,
  readOnly = false,
  basePath = "/admin/delivery",
}: {
  slots: Slot[];
  utilization: SlotDays[];
  monthKey: string;
  todayIso: string;
  storeId?: string;
  readOnly?: boolean;
  basePath?: string;
}) {
  const [selectedDate, setSelectedDate] = useState<string | null>(null);
  const [pending, startTransition] = useTransition();
  const [error, setError] = useState<string | null>(null);
  const [message, setMessage] = useState("");

  const dates = utilization[0]?.days.map((d) => d.date) ?? [];
  const offset = dates.length > 0 ? gridStartOffset(dates[0]) : 0;

  const [yearStr, monthStr] = monthKey.split("-");
  const monthLabel = `${MONTH_LABEL[Number(monthStr) - 1]} ${yearStr}`;
  const prevMonth = shiftMonth(monthKey, -1);
  const nextMonth = shiftMonth(monthKey, 1);
  const todayMonth = todayIso.slice(0, 7);
  const isCurrentMonth = monthKey === todayMonth;

  const overridesByDate = useMemo(() => {
    const map = new Map<string, number>();
    for (const slotRow of utilization) {
      for (const d of slotRow.days) {
        if (d.isOverridden) {
          map.set(d.date, (map.get(d.date) ?? 0) + 1);
        }
      }
    }
    return map;
  }, [utilization]);

  const occupancyByDate = useMemo(() => {
    const map = new Map<string, { booked: number; capacity: number; anyActive: boolean; remaining: number }>();
    for (const slotRow of utilization) {
      for (const d of slotRow.days) {
        const cur = map.get(d.date) ?? { booked: 0, capacity: 0, anyActive: false, remaining: 0 };
        cur.booked += d.booked;
        cur.capacity += d.isActive ? d.capacity : 0;
        cur.anyActive = cur.anyActive || (d.isActive && d.capacity > 0);
        cur.remaining += d.isActive ? Math.max(0, d.capacity - d.booked) : 0;
        map.set(d.date, cur);
      }
    }
    return map;
  }, [utilization]);

  function submit(formData: FormData) {
    if (readOnly) return;
    setError(null);
    setMessage("");
    startTransition(async () => {
      try {
        await upsertSlotOverrideAction(formData);
        setMessage("Pengaturan tanggal tersimpan. Ketersediaan checkout mengikuti perubahan ini.");
      } catch (err) {
        setError(err instanceof Error ? err.message : "Gagal menyimpan override.");
      }
    });
  }

  function clearAllOverridesForDate(date: string) {
    if (readOnly || !storeId) return;
    const overridden = utilization
      .filter((sr) => sr.days.find((d) => d.date === date)?.isOverridden)
      .map((sr) => sr.slotId);
    if (overridden.length === 0) return;
    if (!confirm(`Hapus ${overridden.length} override untuk tanggal ini?`)) return;
    updateDay(date, "reset");
  }

  function updateDay(date: string, mode: "open" | "close" | "reset") {
    if (readOnly || !storeId) return;
    if (mode === "close" && !confirm(`Tutup semua slot pada ${formatDayLabel(date)}? Pesanan yang sudah masuk tetap harus dilayani.`)) return;
    setError(null); setMessage("");
    startTransition(async () => {
      try {
        const fd = new FormData(); fd.set("storeId", storeId); fd.set("date", date); fd.set("mode", mode);
        await setStoreDayAvailabilityAction(fd);
        setMessage(mode === "close" ? "Semua slot tanggal ini ditutup untuk pesanan baru. Pesanan yang sudah ada tetap berlaku." : mode === "open" ? "Pembatasan tutup tanggal dilepas. Kapasitas khusus dan catatan tetap dipertahankan." : "Pengaturan tanggal dikembalikan ke template harian.");
      } catch (err) { setError(err instanceof Error ? err.message : "Perubahan belum tersimpan. Coba lagi."); }
    });
  }

  return (
    <div className="grid gap-4">
      <div>
        <div className="mb-3 flex items-center justify-between gap-2">
          <Link
            href={`${basePath}?month=${prevMonth}${storeId ? `&store=${encodeURIComponent(storeId)}` : ""}`}
            scroll={false}
            className="inline-flex items-center gap-1 rounded-md px-2.5 py-1.5 text-sm font-medium text-stone-700 transition hover:bg-stone-100"
          >
            ← {MONTH_LABEL[(Number(monthStr) + 10) % 12]}
          </Link>
          <div className="text-center">
            <p className="text-base font-semibold text-stone-900">{monthLabel}</p>
            {!isCurrentMonth ? (
              <Link
                href={`${basePath}?month=${todayMonth}${storeId ? `&store=${encodeURIComponent(storeId)}` : ""}`}
                scroll={false}
                className="text-xs font-medium text-stone-500 hover:text-stone-900"
              >
                Kembali ke hari ini
              </Link>
            ) : (
              <p className="text-xs text-stone-500">Bulan ini</p>
            )}
          </div>
          <Link
            href={`${basePath}?month=${nextMonth}${storeId ? `&store=${encodeURIComponent(storeId)}` : ""}`}
            scroll={false}
            className="inline-flex items-center gap-1 rounded-md px-2.5 py-1.5 text-sm font-medium text-stone-700 transition hover:bg-stone-100"
          >
            {MONTH_LABEL[Number(monthStr) % 12]} →
          </Link>
        </div>

        <div className="grid grid-cols-7 gap-1 text-center text-[11px] font-semibold uppercase tracking-wider text-stone-400">
          {["Sen", "Sel", "Rab", "Kam", "Jum", "Sab", "Min"].map((d) => (
            <div key={d} className="py-1">{d}</div>
          ))}
        </div>
        <div className="mt-1 grid grid-cols-7 gap-1">
          {Array.from({ length: offset }).map((_, i) => (
            <div key={`pad-${i}`} />
          ))}
          {dates.map((date) => {
            const occ = occupancyByDate.get(date);
            const overrideCount = overridesByDate.get(date) ?? 0;
            const util =
              occ && occ.capacity > 0 ? occ.booked / occ.capacity : 0;
            const isFull = !!(occ?.anyActive && occ.remaining === 0);
            const isClosed = !!(occ && !occ.anyActive);
            const isSelected = selectedDate === date;
            const isPast = date < todayIso;
            const isToday = date === todayIso;
            const tone = isPast
              ? "border-stone-100 bg-stone-50 text-stone-400"
              : isClosed
              ? "border-stone-200 bg-stone-100 text-stone-400"
              : isFull
              ? "border-rose-200 bg-rose-50"
              : overrideCount > 0
              ? "border-amber-300 bg-amber-50"
              : util > 0.5
              ? "border-stone-300 bg-stone-50"
              : "border-stone-200 bg-white";

            return (
              <button
                type="button"
                key={date}
                aria-label={`${formatDayLabel(date)}, ${isClosed ? `Tutup, ${occ?.booked ?? 0} pesanan tetap berlaku` : `${occ?.booked ?? 0} dari ${occ?.capacity ?? 0} slot terisi`}`}
                aria-pressed={isSelected}
                disabled={pending}
                onClick={() => { setSelectedDate(isSelected ? null : date); setMessage(""); setError(null); }}
                className={`relative flex min-h-16 flex-col items-start justify-between rounded-md border p-1.5 text-left text-xs transition sm:min-h-20 ${tone} ${
                  isSelected ? "ring-2 ring-stone-900 ring-offset-1" : ""
                } ${isToday ? "outline outline-1 outline-rose-500" : ""}`}
              >
                <span className={`text-[11px] font-semibold ${isToday ? "text-rose-700" : "text-stone-700"}`}>
                  {toDate(date).getDate()}
                </span>
                {occ && (occ.capacity > 0 || occ.booked > 0) ? (
                  <span className="text-[10px] text-stone-500">
                    {isClosed ? `${occ.booked} pesanan` : `${occ.booked}/${occ.capacity}`}
                  </span>
                ) : null}
                {isClosed || isFull ? <span className="text-[10px] font-medium">{isClosed ? "Tutup" : "Penuh"}</span> : null}
                {overrideCount > 0 ? (
                  <span className="absolute right-1 top-1 h-1.5 w-1.5 rounded-full bg-amber-500" />
                ) : null}
              </button>
            );
          })}
        </div>
        <div className="mt-3 flex flex-wrap items-center gap-3 text-[11px] text-stone-500">
          <span className="flex items-center gap-1.5">
            <span className="h-2.5 w-2.5 rounded-sm border border-rose-500 outline outline-1 outline-rose-500" />
            Hari ini
          </span>
          <span className="flex items-center gap-1.5">
            <span className="h-2.5 w-2.5 rounded-sm border border-amber-300 bg-amber-50" />
            Ada override
          </span>
          <span className="flex items-center gap-1.5">
            <span className="h-2.5 w-2.5 rounded-sm border border-rose-200 bg-rose-50" />
            Full booked
          </span>
          <span className="flex items-center gap-1.5">
            <span className="h-2.5 w-2.5 rounded-sm border border-stone-200 bg-stone-100" />
            Tutup
          </span>
        </div>
      </div>

      {selectedDate ? (
        <div className="border-t border-stone-200 pt-5">
          <div className="mb-3 flex flex-wrap items-start justify-between gap-3">
            <div>
              <h3 className="mt-0.5 text-lg font-semibold text-stone-900">
                {formatDayLabel(selectedDate)}
              </h3>
            </div>
            <div className="flex flex-wrap items-center gap-2">
              {storeId ? <><Button type="button" variant="danger" disabled={pending || readOnly} onClick={() => updateDay(selectedDate, "close")}>Tutup seharian</Button><Button type="button" variant="secondary" disabled={pending || readOnly} onClick={() => updateDay(selectedDate, "open")}>Buka semua slot</Button></> : null}
              {(overridesByDate.get(selectedDate) ?? 0) > 0 ? (
                <Button
                  type="button"
                  variant="danger"
                  disabled={pending || readOnly}
                  onClick={() => clearAllOverridesForDate(selectedDate)}
                >
                  Ikuti template harian
                </Button>
              ) : null}
              <Button type="button" variant="ghost" onClick={() => setSelectedDate(null)}>
                Tutup
              </Button>
            </div>
          </div>
          <p className="mb-4 text-sm leading-6 text-stone-600">Menutup tanggal menghentikan pesanan baru. Pesanan yang sudah masuk tidak dibatalkan. Kapasitas dihitung per pesanan, termasuk pembayaran aktif.</p>
          {readOnly ? <p className="mb-4 text-sm text-amber-900">Mode pratinjau: Anda dapat meninjau pengaturan, tetapi perubahan tidak disimpan.</p> : null}

          <div className="grid gap-2">
            {slots.map((slot) => {
              const cellForThisSlot = utilization
                .find((u) => u.slotId === slot.id)
                ?.days.find((d) => d.date === selectedDate);

              return (
                <SlotOverrideRow
                  key={`${slot.id}-${selectedDate}-${cellForThisSlot?.overrideCapacity}-${cellForThisSlot?.overrideIsActive}-${cellForThisSlot?.note}`}
                  slot={slot}
                  date={selectedDate}
                  effectiveCapacity={cellForThisSlot?.capacity ?? slot.capacity}
                  effectiveActive={cellForThisSlot?.isActive ?? slot.isActive}
                  booked={cellForThisSlot?.booked ?? 0}
                  isOverridden={!!cellForThisSlot?.isOverridden}
                  note={cellForThisSlot?.note ?? ""}
                  overrideCapacity={cellForThisSlot?.overrideCapacity ?? null}
                  overrideIsActive={cellForThisSlot?.overrideIsActive ?? null}
                  readOnly={readOnly}
                  pending={pending}
                  onSubmit={submit}
                />
              );
            })}
          </div>

          {error ? <p role="alert" className="mt-3 text-sm font-medium text-rose-700">{error}</p> : null}
          {message ? <p role="status" className="mt-3 text-sm font-medium text-emerald-800">{message}</p> : null}
        </div>
      ) : (
        <p className="text-center text-xs text-stone-500">
          Klik tanggal di kalender untuk mengatur kapasitas khusus atau menutup slot.
        </p>
      )}
    </div>
  );
}

function SlotOverrideRow({
  slot,
  date,
  effectiveCapacity,
  effectiveActive,
  booked,
  isOverridden,
  note,
  pending,
  onSubmit,
  overrideCapacity,
  overrideIsActive,
  readOnly,
}: {
  slot: Slot;
  date: string;
  effectiveCapacity: number;
  effectiveActive: boolean;
  booked: number;
  isOverridden: boolean;
  note: string;
  pending: boolean;
  onSubmit: (formData: FormData) => void;
  overrideCapacity: number | null;
  overrideIsActive: boolean | null;
  readOnly: boolean;
}) {
  const [open, setOpen] = useState(isOverridden);

  return (
    <div className="rounded-md border border-stone-200 bg-stone-50/40 p-3">
      <div className="flex flex-wrap items-center justify-between gap-2">
        <div className="min-w-0">
          <p className="text-sm font-medium text-stone-900">{slot.label}</p>
          <p className="text-xs text-stone-500">
            {slot.startTime}–{slot.endTime} · default kapasitas {slot.capacity}
          </p>
        </div>
        <div className="flex items-center gap-2">
          <span className={tagClass(!effectiveActive ? "neutral" : booked >= effectiveCapacity ? "rose" : "emerald")}>
            {!effectiveActive || effectiveCapacity === 0 ? `Tutup · ${booked} pesanan` : `${booked}/${effectiveCapacity}`}
          </span>
          {isOverridden ? <span className={tagClass("amber")}>Override</span> : null}
          <Button type="button" variant="ghost" onClick={() => setOpen(!open)}>
            {open ? "Tutup" : "Atur"}
          </Button>
        </div>
      </div>

      {open ? (
        <form
          aria-label={`Pengaturan ${slot.label} ${date}`}
          action={(fd) => {
            fd.set("slotId", slot.id);
            fd.set("date", date);
            onSubmit(fd);
          }}
          className="mt-3 grid gap-2 sm:grid-cols-[1fr_1fr_auto]"
        >
          <label className="grid gap-1 text-xs text-stone-600">
            Kapasitas custom
            <input
              name="capacity"
              type="number"
              min={0}
              defaultValue={overrideCapacity ?? ""}
              max={10000}
              step={1}
              placeholder={`Kosongkan = ${slot.capacity}`}
              className={inputClass()}
            />
          </label>
          <label className="grid gap-1 text-xs text-stone-600">
            Status
            <select
              name="isActive"
              defaultValue={
                overrideIsActive === null ? "" : overrideIsActive ? "active" : "disabled"
              }
              className={inputClass()}
            >
              <option value="">Ikut default ({slot.isActive ? "aktif" : "nonaktif"})</option>
              <option value="active">Paksa aktif</option>
              <option value="disabled">Tutup tanggal ini</option>
            </select>
          </label>
          <Button type="submit" variant="primary" disabled={pending || readOnly} className="self-end">
            {pending ? "..." : "Simpan"}
          </Button>
          <label className="grid gap-1 text-xs text-stone-600 sm:col-span-3">
            Catatan (opsional)
            <input
              name="note"
              maxLength={200}
              defaultValue={note}
              placeholder="Mis. Valentine's day — kapasitas 2× normal"
              className={inputClass()}
            />
          </label>
        </form>
      ) : null}
    </div>
  );
}
