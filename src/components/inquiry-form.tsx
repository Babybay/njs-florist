"use client";

import { useState, useTransition } from "react";
import { submitInquiryAction } from "@/server/actions/inquiry.actions";
import { Button } from "@/components/ui/store-ui";

const fieldClass =
  "rounded-md border border-stone-300 px-3 py-2.5 text-sm outline-none focus:border-black";

export function InquiryForm() {
  const [pending, startTransition] = useTransition();
  const [error, setError] = useState<string | null>(null);
  const [submitted, setSubmitted] = useState(false);

  function submit(formData: FormData) {
    setError(null);
    startTransition(async () => {
      try {
        await submitInquiryAction(formData);
        setSubmitted(true);
      } catch (err) {
        setError(err instanceof Error ? err.message : "Gagal mengirim inquiry.");
      }
    });
  }

  if (submitted) {
    return (
      <div className="rounded-md border border-emerald-300 bg-emerald-50 p-6 text-sm text-emerald-900">
        <p className="font-semibold">Terima kasih!</p>
        <p className="mt-1">
          Inquiry kamu sudah masuk. Tim florist kami akan menghubungi via WhatsApp atau email
          dalam 1×24 jam.
        </p>
      </div>
    );
  }

  return (
    <form action={submit} className="grid gap-4 rounded-md border border-stone-200 bg-white p-6">
      <div className="grid gap-3 sm:grid-cols-2">
        <input name="customerName" required placeholder="Nama lengkap" className={fieldClass} />
        <input name="customerEmail" type="email" required placeholder="Email" className={fieldClass} />
        <input name="customerPhone" placeholder="No WhatsApp (opsional)" className={fieldClass} />
        <input name="occasion" placeholder="Acara (mis. wedding, ultah)" className={fieldClass} />
        <input name="budget" type="number" min={0} placeholder="Budget kasaran (IDR)" className={fieldClass} />
        <input name="preferredDate" type="date" className={fieldClass} />
      </div>
      <textarea
        name="notes"
        required
        rows={5}
        placeholder="Ceritakan visi kamu — warna, jenis bunga, mood, ukuran, dll."
        className={fieldClass}
      />
      <textarea
        name="referenceUrls"
        rows={2}
        placeholder="URL gambar referensi (pisah dengan spasi atau baris baru)"
        className={fieldClass}
      />
      <Button type="submit" disabled={pending} className="w-fit">
        {pending ? "Mengirim…" : "Kirim inquiry"}
      </Button>
      {error ? <p className="text-sm font-semibold text-rose-700">{error}</p> : null}
    </form>
  );
}
