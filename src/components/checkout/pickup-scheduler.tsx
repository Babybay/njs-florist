"use client";

import { useEffect, useRef, useState } from "react";
import { addPickupDays, formatPickupDate, pickupDateColumn, PICKUP_STATUS_LABELS, type PickupAvailability, type PickupSlotAvailability } from "@/lib/pickup-schedule";

function monthRange(month: string) {
  const [year, number] = month.split("-").map(Number);
  return { from: `${month}-01`, to: `${month}-${new Date(Date.UTC(year, number, 0)).getUTCDate()}` };
}
function shiftMonth(month: string, delta: number) {
  const [year, number] = month.split("-").map(Number);
  return new Date(Date.UTC(year, number - 1 + delta, 1)).toISOString().slice(0, 7);
}

export function PickupScheduler({ storeId, minDate, onSelectionChange }: {
  storeId: string; minDate: string;
  onSelectionChange: (date: string, slot: PickupSlotAvailability | null) => void;
}) {
  const [month, setMonth] = useState(minDate.slice(0, 7));
  const [date, setDate] = useState(minDate);
  const [slotId, setSlotId] = useState("");
  const [availability, setAvailability] = useState<PickupAvailability | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [refresh, setRefresh] = useState(0);
  const [focusDate, setFocusDate] = useState(minDate);
  const calendarRef = useRef<HTMLDivElement>(null);
  const { from, to } = monthRange(month);
  const currentData = availability?.storeId === storeId && availability.days[0]?.date === from ? availability : null;
  const selectedDay = currentData?.days.find((day) => day.date === date);
  const selectedSlot = selectedDay?.slots.find((slot) => slot.id === slotId && slot.status === "available") ?? null;
  const ready = !loading && !error && !!selectedSlot;
  const effectiveMin = currentData?.minDate && currentData.minDate > minDate ? currentData.minDate : minDate;

  useEffect(() => { onSelectionChange(date, ready ? selectedSlot : null); }, [date, ready, selectedSlot, onSelectionChange]);
  useEffect(() => {
    if (!storeId) { setLoading(false); return; }
    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), 12_000);
    let active = true;
    setLoading(true); setError("");
    const params = new URLSearchParams({ storeId, from, to });
    fetch(`/api/pickup/availability?${params}`, { signal: controller.signal, cache: "no-store" })
      .then(async (response) => {
        const data = await response.json();
        if (!response.ok) throw new Error(data.error || "Jadwal belum bisa dimuat.");
        if (active) setAvailability(data);
      })
      .catch((reason) => { if (active) setError(reason?.name === "AbortError" ? "Jadwal terlalu lama dimuat. Periksa koneksi dan coba lagi." : reason.message); })
      .finally(() => { clearTimeout(timeout); if (active) setLoading(false); });
    return () => { active = false; clearTimeout(timeout); controller.abort(); };
  }, [storeId, from, to, refresh]);
  useEffect(() => {
    const update = () => { if (!document.hidden) setRefresh((value) => value + 1); };
    const timer = setInterval(update, 60_000);
    window.addEventListener("focus", update);
    return () => { clearInterval(timer); window.removeEventListener("focus", update); };
  }, []);

  const monthLabel = formatPickupDate(from, { weekday: undefined, day: undefined, month: "long", year: "numeric" });
  const offset = (pickupDateColumn(from).getUTCDay() + 6) % 7;
  function selectDay(value: string) { setDate(value); setSlotId(""); setFocusDate(value); }
  function changeMonth(next: string) {
    setMonth(next); setSlotId(""); setFocusDate(`${next}-01` < effectiveMin ? effectiveMin : `${next}-01`);
  }
  function moveFocus(event: React.KeyboardEvent<HTMLButtonElement>, value: string) {
    const weekday = (pickupDateColumn(value).getUTCDay() + 6) % 7;
    const offsets: Record<string, number> = { ArrowRight: 1, ArrowLeft: -1, ArrowDown: 7, ArrowUp: -7, Home: -weekday, End: 6 - weekday };
    if (!(event.key in offsets)) return;
    event.preventDefault();
    let next = addPickupDays(value, offsets[event.key]);
    if (next < effectiveMin) next = effectiveMin;
    if (next < from || next > to) return;
    setFocusDate(next);
    calendarRef.current?.querySelector<HTMLButtonElement>(`[data-date="${next}"]`)?.focus();
  }

  return <div className="pickup-scheduler" aria-busy={loading}>
    <input type="hidden" name="deliveryDate" value={date} />
    <input type="hidden" name="slotId" value={ready ? selectedSlot.id : ""} />
    <div className="pickup-calendar">
      <div className="pickup-calendar-heading"><h3 id="pickup-month">{monthLabel}</h3><div>
        <button type="button" className="pickup-month-button" aria-label="Bulan sebelumnya" disabled={month <= effectiveMin.slice(0, 7)} onClick={() => changeMonth(shiftMonth(month, -1))}><svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.6" aria-hidden="true"><path d="m14 6-6 6 6 6" /></svg></button>
        <button type="button" className="pickup-month-button" aria-label="Bulan berikutnya" onClick={() => changeMonth(shiftMonth(month, 1))}><svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.6" aria-hidden="true"><path d="m10 6 6 6-6 6" /></svg></button>
      </div></div>
      <p id="pickup-calendar-help" className="checkout-help">Pilih tanggal. Gunakan tombol panah untuk berpindah hari.</p>
      <div className="pickup-calendar-grid" ref={calendarRef} role="group" aria-labelledby="pickup-month" aria-describedby="pickup-calendar-help">
        {["Sen", "Sel", "Rab", "Kam", "Jum", "Sab", "Min"].map((day) => <span key={day} className="pickup-weekday" aria-hidden="true">{day}</span>)}
        {Array.from({ length: offset }, (_, index) => <span key={`blank-${index}`} aria-hidden="true" />)}
        {Array.from({ length: Number(to.slice(-2)) }, (_, index) => {
          const value = addPickupDays(from, index);
          const available = currentData?.days.find((item) => item.date === value)?.slots.some((slot) => slot.status === "available");
          const disabled = loading || !!error || value < effectiveMin || !available;
          const status = value < effectiveMin ? "Sudah lewat" : available ? "Tersedia" : "Tidak tersedia";
          return <button key={value} type="button" data-date={value} className="pickup-day" aria-pressed={date === value} aria-disabled={disabled} aria-label={`${formatPickupDate(value)}, ${status}`} tabIndex={value === focusDate ? 0 : -1} onKeyDown={(event) => moveFocus(event, value)} onClick={() => { if (!disabled) selectDay(value); }}>
            <span>{index + 1}</span><span className="pickup-day-marker" data-available={!disabled} aria-hidden="true" />
          </button>;
        })}
      </div>
      <div className="pickup-calendar-legend"><span><i aria-hidden="true" /> Tersedia</span><span>Tanggal redup tidak tersedia</span></div>
    </div>
    <div className="pickup-times">
      <div className="pickup-time-heading"><h3>Jam pickup</h3><span>WITA · waktu Bali</span></div>
      <p className="checkout-help">{formatPickupDate(date)}</p>
      <div className="pickup-availability-status" role="status" aria-live="polite">
        {loading ? <p>Memeriksa ketersediaan…</p> : error ? <div className="checkout-error"><p>{error}</p><button type="button" onClick={() => setRefresh((value) => value + 1)}>Coba lagi</button></div> : null}
      </div>
      {!loading && !error && selectedDay ? <fieldset className="pickup-slot-list">
        <legend className="sr-only">Pilih jam pickup untuk {formatPickupDate(date)}</legend>
        {selectedDay.slots.map((slot) => <label key={slot.id} className="pickup-slot" data-disabled={slot.status !== "available"}>
          <input type="radio" name="pickupSlotChoice" value={slot.id} checked={selectedSlot?.id === slot.id} disabled={slot.status !== "available"} onChange={() => setSlotId(slot.id)} />
          <span><strong>{slot.startTime}–{slot.endTime}</strong><span>{slot.label}</span></span><small>{slot.status === "available" ? `${slot.remaining} slot tersisa` : PICKUP_STATUS_LABELS[slot.status]}</small>
        </label>)}
        {!selectedDay.slots.some((slot) => slot.status === "available") ? <div className="pickup-no-slots"><p>Tidak ada jam pickup yang tersedia pada tanggal ini.</p><p className="checkout-help">Pilih tanggal lain di kalender atau coba toko lainnya.</p></div> : null}
      </fieldset> : null}
      {!loading && !error && !selectedDay ? <p className="checkout-help">Pilih tanggal di bulan ini untuk melihat jam pickup.</p> : null}
      {slotId && !loading && !error && !selectedSlot ? <p className="checkout-error" role="alert">Slot pilihan Anda sudah tidak tersedia. Pilih jam lain.</p> : null}
      <p className="pickup-hold-note">Slot dikonfirmasi saat pesanan dibuat. Selesaikan pembayaran dalam 15 menit.</p>
    </div>
  </div>;
}
