"use client";

import { useActionState } from "react";
import {
  type CheckoutFormState,
  submitCheckoutAction,
} from "@/server/actions/checkout.actions";
import { Button } from "@/components/ui/store-ui";

type Slot = {
  id: string;
  label: string;
  capacity: number;
};

const initialState: CheckoutFormState = {};

const fieldClass =
  "rounded-md border border-stone-300 px-3 py-3 font-normal outline-none focus:border-black";

export function CheckoutForm({
  slots,
  minDate,
  pickupAddress,
}: {
  slots: Slot[];
  minDate: string;
  pickupAddress: string;
}) {
  const [state, formAction, pending] = useActionState(submitCheckoutAction, initialState);

  return (
    <form action={formAction} className="grid gap-5 rounded-md border border-stone-200 bg-white p-6">
      <div className="rounded-md border border-black/15 bg-[color:var(--blush)] px-4 py-3 text-sm text-black">
        <p className="font-semibold uppercase tracking-[0.14em]">Pickup di toko</p>
        <p className="mt-1 text-black/80">{pickupAddress}</p>
      </div>

      <div className="grid gap-4 sm:grid-cols-2">
        <label className="grid gap-2 text-sm font-semibold text-black">
          Nama pengambil *
          <input name="recipientName" required className={fieldClass} />
        </label>
        <label className="grid gap-2 text-sm font-semibold text-black">
          Nomor WhatsApp *
          <input
            name="recipientPhone"
            required
            placeholder="+62…"
            className={fieldClass}
          />
        </label>
        <label className="grid gap-2 text-sm font-semibold text-black">
          Nama pemesan *
          <input name="senderName" required className={fieldClass} />
        </label>
        <label className="flex items-end gap-2 text-sm font-semibold text-black">
          <input type="checkbox" name="isAnonymous" className="h-4 w-4 accent-black" />
          Sembunyikan nama pemesan
        </label>
      </div>

      <div className="grid gap-4 sm:grid-cols-2">
        <label className="grid gap-2 text-sm font-semibold text-black">
          Tanggal pickup *
          <input
            type="date"
            name="deliveryDate"
            required
            min={minDate}
            className={fieldClass}
          />
        </label>
        <label className="grid gap-2 text-sm font-semibold text-black">
          Slot pickup *
          <select name="slotId" required className={fieldClass}>
            <option value="">Pilih slot</option>
            {slots.map((slot) => (
              <option key={slot.id} value={slot.id}>
                {slot.label}
              </option>
            ))}
          </select>
        </label>
      </div>

      <label className="grid gap-2 text-sm font-semibold text-black">
        Catatan untuk staff (opsional)
        <input
          name="notes"
          placeholder="Mis. tolong siapkan lebih awal, dll."
          className={fieldClass}
        />
      </label>

      <label className="grid gap-2 text-sm font-semibold text-black">
        Pesan kartu (opsional)
        <textarea name="cardMessage" rows={3} maxLength={300} className={fieldClass} />
      </label>

      <label className="grid gap-2 text-sm font-semibold text-black">
        Kode diskon (opsional)
        <input name="discountCode" className={fieldClass} />
      </label>

      {state.error ? (
        <p className="rounded-md bg-rose-50 px-3 py-2 text-sm font-semibold text-rose-700">
          {state.error}
        </p>
      ) : null}

      <Button type="submit" disabled={pending} className="w-full">
        {pending ? "Membuat pesanan…" : "Buat pesanan & lanjut bayar"}
      </Button>
    </form>
  );
}
