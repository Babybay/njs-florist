"use client";

import { useState, useTransition } from "react";
import { formatIDR } from "@/lib/money";
import { updateInquiryAction } from "@/server/actions/inquiry.actions";

type Inquiry = {
  id: string;
  customerName: string;
  customerEmail: string;
  customerPhone: string | null;
  occasion: string | null;
  budget: number | null;
  preferredDate: Date | null;
  notes: string;
  referenceUrls: string[];
  status: string;
  adminNote: string | null;
  createdAt: Date;
};

const STATUSES = ["NEW", "CONTACTED", "QUOTED", "WON", "LOST"];

export function InquiryRow({ inquiry }: { inquiry: Inquiry }) {
  const [pending, startTransition] = useTransition();
  const [status, setStatus] = useState(inquiry.status);
  const [note, setNote] = useState(inquiry.adminNote ?? "");
  const [error, setError] = useState<string | null>(null);

  function save() {
    setError(null);
    const fd = new FormData();
    fd.set("id", inquiry.id);
    fd.set("status", status);
    fd.set("adminNote", note);
    startTransition(async () => {
      try {
        await updateInquiryAction(fd);
      } catch (err) {
        setError(err instanceof Error ? err.message : "Gagal menyimpan.");
      }
    });
  }

  return (
    <article className="rounded-lg border border-stone-200 bg-white p-5 shadow-sm">
      <div className="flex flex-wrap items-center gap-3">
        <p className="font-semibold text-stone-950">{inquiry.customerName}</p>
        <span className="rounded-full bg-stone-100 px-2 py-0.5 text-xs font-semibold text-stone-700">
          {inquiry.status}
        </span>
        <span className="text-xs text-stone-500">
          {new Date(inquiry.createdAt).toLocaleString("id-ID")}
        </span>
      </div>
      <p className="mt-1 text-sm text-stone-600">
        {inquiry.customerEmail}
        {inquiry.customerPhone ? ` · ${inquiry.customerPhone}` : ""}
        {inquiry.occasion ? ` · ${inquiry.occasion}` : ""}
        {inquiry.budget ? ` · Budget ${formatIDR(inquiry.budget)}` : ""}
        {inquiry.preferredDate
          ? ` · Untuk ${new Date(inquiry.preferredDate).toLocaleDateString("id-ID")}`
          : ""}
      </p>
      <p className="mt-3 whitespace-pre-wrap text-sm text-stone-700">{inquiry.notes}</p>
      {inquiry.referenceUrls.length > 0 ? (
        <ul className="mt-3 flex flex-wrap gap-3 text-xs">
          {inquiry.referenceUrls.map((url, idx) => (
            <li key={idx}>
              <a
                href={url}
                target="_blank"
                rel="noopener noreferrer"
                className="font-semibold text-rose-700 hover:underline"
              >
                Referensi #{idx + 1}
              </a>
            </li>
          ))}
        </ul>
      ) : null}

      <div className="mt-4 grid gap-3 sm:grid-cols-[160px_1fr_auto]">
        <select
          value={status}
          onChange={(e) => setStatus(e.target.value)}
          className="rounded-md border border-stone-300 px-3 py-2 text-sm outline-none focus:border-rose-500"
        >
          {STATUSES.map((s) => (
            <option key={s} value={s}>
              {s}
            </option>
          ))}
        </select>
        <input
          value={note}
          onChange={(e) => setNote(e.target.value)}
          placeholder="Catatan internal (mis. quote IDR 850k, follow-up Selasa)"
          className="rounded-md border border-stone-300 px-3 py-2 text-sm outline-none focus:border-rose-500"
        />
        <button
          type="button"
          onClick={save}
          disabled={pending}
          className="rounded-full bg-rose-900 px-4 py-2 text-xs font-semibold text-white hover:bg-rose-800 disabled:bg-stone-400"
        >
          {pending ? "..." : "Simpan"}
        </button>
      </div>
      {error ? <p className="mt-2 text-sm font-semibold text-rose-700">{error}</p> : null}
    </article>
  );
}
