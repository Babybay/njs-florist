"use client";

import { useActionState, useCallback, useEffect, useRef, useState } from "react";
import { type CheckoutFormState, submitCheckoutAction } from "@/server/actions/checkout.actions";
import { PickupScheduler } from "@/components/checkout/pickup-scheduler";
import { formatPickupDate, type PickupSlotAvailability } from "@/lib/pickup-schedule";

type Store = { id: string; name: string; address: string; phone: string | null };
const initialState: CheckoutFormState = {};
const cardSuggestions = [
  { label: "Ulang tahun", message: "Selamat ulang tahun! Semoga hari ini seindah bunga-bunga ini." },
  { label: "Terima kasih", message: "Terima kasih sudah membuat hari-hari terasa lebih indah." },
  { label: "Untukmu", message: "Sedikit bunga, untuk seseorang yang berarti banyak." },
];

export function CheckoutForm({ minDate, stores, preview = false }: {
  minDate: string; stores: Store[]; preview?: boolean;
}) {
  const [state, formAction, pending] = useActionState(submitCheckoutAction, initialState);
  const [selectedStoreId, setSelectedStoreId] = useState(stores[0]?.id ?? "");
  const [selection, setSelection] = useState<{ date: string; slot: PickupSlotAvailability | null }>({ date: minDate, slot: null });
  const [recipientName, setRecipientName] = useState("");
  const [recipientPhone, setRecipientPhone] = useState("");
  const [senderName, setSenderName] = useState("");
  const [isAnonymous, setIsAnonymous] = useState(false);
  const [cardMessage, setCardMessage] = useState("");
  const [notes, setNotes] = useState("");
  const [discountCode, setDiscountCode] = useState("");
  const errorRef = useRef<HTMLDivElement>(null);
  const store = stores.find((item) => item.id === selectedStoreId);
  const onSelectionChange = useCallback((date: string, slot: PickupSlotAvailability | null) => setSelection({ date, slot }), []);
  useEffect(() => { if (state.error) errorRef.current?.focus(); }, [state]);

  return (
    <form action={formAction} className="checkout-form">
      <fieldset disabled={pending} className="checkout-fields">
        <fieldset className="checkout-section">
          <legend><span aria-hidden="true">1</span> Pilih toko pickup</legend>
          <p className="checkout-section-description">Buket Anda akan disiapkan di toko yang dipilih.</p>
          <div className="pickup-store-list">
            {stores.map((item) => <label key={item.id} className="pickup-store">
              <input type="radio" name="storeId" value={item.id} required checked={selectedStoreId === item.id}
                onChange={() => { setSelectedStoreId(item.id); setSelection({ date: minDate, slot: null }); }} />
              <span><strong>{item.name}</strong><span>{item.address}</span>{item.phone ? <small>{item.phone}</small> : null}</span>
            </label>)}
          </div>
          {!stores.length ? <p className="checkout-error" role="status">Belum ada toko yang menerima pickup. Silakan hubungi kami untuk bantuan pemesanan.</p> : null}
        </fieldset>
        <fieldset className="checkout-section">
          <legend><span aria-hidden="true">2</span> Kapan ingin mengambilnya?</legend>
          <p className="checkout-section-description">Pilih tanggal dan jam yang paling pas. Semua waktu mengikuti WITA.</p>
          {store ? <PickupScheduler key={selectedStoreId} storeId={selectedStoreId} minDate={minDate} onSelectionChange={onSelectionChange} /> : null}
          {selection.slot ? <div className="pickup-selection-summary" role="status">
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.6" aria-hidden="true"><path d="m5 12 4 4L19 6" /></svg>
            <p><strong>{formatPickupDate(selection.date)} · {selection.slot.startTime}–{selection.slot.endTime} WITA</strong><span>Pickup di {store?.name}</span></p>
          </div> : null}
        </fieldset>
        <fieldset className="checkout-section">
          <legend><span aria-hidden="true">3</span> Detail pengambil & pemesan</legend>
          <p className="checkout-section-description">Bisa diambil sendiri atau oleh orang yang Anda tunjuk. Semua kolom bertanda * wajib diisi.</p>
          <div className="checkout-contact-grid">
            <label className="checkout-label">Nama pengambil *<input name="recipientName" required maxLength={120} autoComplete="section-pickup name" value={recipientName} onChange={(event) => setRecipientName(event.target.value)} /></label>
            <label className="checkout-label">Nomor WhatsApp pengambil *<input name="recipientPhone" type="tel" inputMode="tel" required autoComplete="section-pickup tel" minLength={8} maxLength={25} placeholder="Contoh: 0812 3456 7890" value={recipientPhone} onChange={(event) => setRecipientPhone(event.target.value)} /></label>
            <label className="checkout-label">Nama pemesan *<input name="senderName" required maxLength={120} autoComplete="section-sender name" value={senderName} onChange={(event) => setSenderName(event.target.value)} /></label>
          </div>
          <label className="checkout-checkbox"><input type="checkbox" name="isAnonymous" checked={isAnonymous} onChange={(event) => setIsAnonymous(event.target.checked)} /><span>Sembunyikan nama pemesan dari penerima<span className="checkout-help">Tim toko tetap dapat melihat nama Anda untuk memproses pesanan.</span></span></label>
        </fieldset>
        <fieldset className="checkout-section">
          <legend><span aria-hidden="true">4</span> Tambahkan sentuhan Anda <small>Opsional</small></legend>
          <label className="checkout-label" htmlFor="card-message">Pesan untuk kartu ucapan</label>
          {!cardMessage ? <div className="checkout-card-suggestions" aria-label="Inspirasi pesan kartu">{cardSuggestions.map((suggestion) => <button key={suggestion.label} type="button" onClick={() => setCardMessage(suggestion.message)}>{suggestion.label}</button>)}</div> : null}
          <textarea id="card-message" name="cardMessage" rows={4} maxLength={300} placeholder="Kadang, beberapa kata sudah cukup berarti…" value={cardMessage} onChange={(event) => setCardMessage(event.target.value)} aria-describedby="card-message-hint" />
          <p id="card-message-hint" className="checkout-character-count">Dicetak sesuai yang Anda tulis.<span>{cardMessage.length}/300</span></p>
          <label className="checkout-label">Catatan untuk tim toko<textarea name="notes" rows={2} maxLength={1000} placeholder="Misalnya: akan diambil oleh teman saya." value={notes} onChange={(event) => setNotes(event.target.value)} /></label>
          <details className="checkout-discount"><summary>Punya kode diskon?</summary><label className="checkout-label">Kode diskon<input name="discountCode" maxLength={64} autoCapitalize="characters" spellCheck={false} value={discountCode} onChange={(event) => setDiscountCode(event.target.value)} /></label><p className="checkout-help">Kode diperiksa dan diskon dihitung saat pesanan dibuat.</p></details>
        </fieldset>
      </fieldset>
      {state.error ? <div ref={errorRef} tabIndex={-1} className="checkout-error" role="alert"><strong>Checkout belum selesai</strong><p>{state.error}</p><p className="checkout-help">Detail Anda tetap tersimpan di halaman ini.</p></div> : null}
      <div className="checkout-submit-area">
        <button type="submit" className="checkout-submit" disabled={pending || !selection.slot || !store || preview}>
          {pending ? "Menyiapkan pesanan…" : preview ? "Pembayaran nonaktif di pratinjau" : "Buat pesanan & lanjut bayar"}
          <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.6" aria-hidden="true"><path d="M5 12h14m-6-6 6 6-6 6" /></svg>
        </button>
        <p className="checkout-help">{!selection.slot ? "Pilih tanggal dan jam pickup untuk melanjutkan." : "Pembayaran diproses melalui Midtrans. Siapkan nomor pesanan saat mengambil buket."}</p>
      </div>
    </form>
  );
}
