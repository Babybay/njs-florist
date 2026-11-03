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
        setError(err instanceof Error ? err.message : "Permintaan belum terkirim. Silakan coba lagi.");
      }
    });
  }

  if (submitted) {
    return (
      <div className="rounded-md border border-emerald-300 bg-emerald-50 p-6 text-sm text-emerald-900">
        <p className="font-semibold">Permintaan Anda sudah kami terima.</p>
        <p className="mt-1">
          Tim NJS Projects akan menghubungi Anda melalui WhatsApp atau email yang dicantumkan
          untuk membahas rangkaian dan ketersediaannya.
        </p>
      </div>
    );
  }

  return (
    <form action={submit} className="grid gap-4 rounded-md border border-stone-200 bg-white p-6">
      <div className="grid gap-3 sm:grid-cols-2">
        <label className="grid gap-2 text-sm">Nama lengkap (wajib)<input name="customerName" autoComplete="name" required placeholder="Nama Anda" className={fieldClass} /></label>
        <label className="grid gap-2 text-sm">Email (wajib)<input name="customerEmail" autoComplete="email" type="email" required placeholder="nama@email.com" className={fieldClass} /></label>
        <label className="grid gap-2 text-sm">Nomor WhatsApp (opsional)<input name="customerPhone" type="tel" autoComplete="tel" placeholder="Contoh: 0812 3456 7890" className={fieldClass} /></label>
        <label className="grid gap-2 text-sm">Acara atau tujuan hadiah (opsional)<input name="occasion" placeholder="Ulang tahun, pernikahan, ucapan terima kasih" className={fieldClass} /></label>
        <label className="grid gap-2 text-sm">Perkiraan anggaran (Rp, opsional)<input name="budget" type="number" min={0} placeholder="Contoh: 350000" className={fieldClass} /></label>
        <label className="grid gap-2 text-sm">Tanggal yang diinginkan (opsional)<input name="preferredDate" type="date" className={fieldClass} /></label>
      </div>
      <label className="grid gap-2 text-sm">Ceritakan rangkaian Anda (wajib)<textarea
        name="notes"
        required
        rows={5}
        placeholder="Warna favorit, jenis bunga, ukuran, atau suasana yang Anda inginkan."
        className={fieldClass}
      /></label>
      <label className="grid gap-2 text-sm">Tautan foto referensi (opsional)<textarea
        name="referenceUrls"
        rows={2}
        placeholder="Tempel tautan foto. Pisahkan beberapa tautan dengan baris baru."
        className={fieldClass}
      /></label>
      <p className="text-sm leading-6 text-stone-600">Formulir ini adalah permintaan konsultasi. Detail rangkaian, harga, dan jadwal akan dibahas bersama tim.</p>
      <Button type="submit" disabled={pending} className="w-fit">
        {pending ? "Mengirim permintaan…" : "Kirim permintaan rangkaian"}
      </Button>
      {error ? <p className="text-sm font-semibold text-rose-700">{error}</p> : null}
    </form>
  );
}
