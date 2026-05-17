"use client";

import { useState, useTransition } from "react";
import { syncPaymentStatusAction } from "@/server/actions/payment.actions";
import { statusLabel } from "@/lib/order-display";

export function RefreshPaymentButton({
  orderNumber,
  className,
  label = "Cek status pembayaran",
}: {
  orderNumber: string;
  className?: string;
  label?: string;
}) {
  const [pending, startTransition] = useTransition();
  const [error, setError] = useState<string | null>(null);
  const [info, setInfo] = useState<string | null>(null);

  function run() {
    setError(null);
    setInfo(null);
    const fd = new FormData();
    fd.set("orderNumber", orderNumber);
    startTransition(async () => {
      try {
        const result = await syncPaymentStatusAction(fd);
        if (result.previousStatus === result.currentStatus) {
          setInfo(`Status di Midtrans: ${result.midtransStatus}. Belum berubah.`);
        } else {
          setInfo(`Status diperbarui: ${result.previousStatus} → ${result.currentStatus}.`);
        }
      } catch (err) {
        setError(err instanceof Error ? err.message : "Gagal cek status.");
      }
    });
  }

  return (
    <div className="flex flex-col gap-1.5">
      <button
        type="button"
        onClick={run}
        disabled={pending}
        className={
          className ??
          "inline-flex items-center justify-center gap-1.5 rounded-md border border-stone-200 bg-white px-3 py-1.5 text-sm font-medium text-stone-800 transition hover:bg-stone-100 disabled:cursor-not-allowed disabled:opacity-50"
        }
      >
        <svg
          viewBox="0 0 16 16"
          width="14"
          height="14"
          fill="none"
          stroke="currentColor"
          strokeWidth="1.75"
          strokeLinecap="round"
          strokeLinejoin="round"
          className={pending ? "animate-spin" : ""}
        >
          <path d="M13.5 8a5.5 5.5 0 1 1-2-4.25" />
          <path d="M13.5 2v3.5h-3.5" />
        </svg>
        {pending ? "Mengecek..." : label}
      </button>
      {info ? <p className="text-xs font-medium text-emerald-700">{info}</p> : null}
      {error ? <p className="text-xs font-medium text-rose-700">{error}</p> : null}
    </div>
  );
}
