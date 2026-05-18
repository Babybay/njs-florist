"use client";

import { useState, useTransition } from "react";
import { adminTransitionAction } from "@/server/actions/order-status.actions";
import type { OrderStatus } from "@/types/order";

const NEXT_STEPS: Record<string, { to: OrderStatus; label: string; variant: "primary" | "ghost" }[]> = {
  PAID: [{ to: "PREPARING", label: "Mulai siapkan", variant: "primary" }],
  PREPARING: [{ to: "READY_FOR_DELIVERY", label: "Siap untuk pickup", variant: "primary" }],
  READY_FOR_DELIVERY: [{ to: "DELIVERED", label: "Tandai sudah diambil", variant: "primary" }],
  DELIVERED: [{ to: "COMPLETED", label: "Tutup pesanan", variant: "primary" }],
};

const CANCELLABLE = new Set([
  "PAID",
  "PREPARING",
  "READY_FOR_DELIVERY",
]);

export function OrderStatusControls({
  orderId,
  status,
}: {
  orderId: string;
  status: OrderStatus;
}) {
  const [pending, startTransition] = useTransition();
  const [error, setError] = useState<string | null>(null);
  const [note, setNote] = useState("");

  function go(to: OrderStatus, confirmMsg?: string) {
    if (confirmMsg && !confirm(confirmMsg)) return;
    setError(null);
    const fd = new FormData();
    fd.set("orderId", orderId);
    fd.set("toStatus", to);
    if (note) fd.set("note", note);
    startTransition(async () => {
      try {
        await adminTransitionAction(fd);
        setNote("");
      } catch (err) {
        setError(err instanceof Error ? err.message : "Transisi gagal.");
      }
    });
  }

  const nextSteps = NEXT_STEPS[status] ?? [];
  const canCancel = CANCELLABLE.has(status);
  const canRefund = status === "PAID" || status === "COMPLETED" || status === "DELIVERED";

  if (nextSteps.length === 0 && !canCancel && !canRefund) {
    return (
      <p className="text-sm text-stone-500">
        Pesanan terminal — tidak ada transisi yang tersedia.
      </p>
    );
  }

  return (
    <div className="flex flex-col gap-3">
      <input
        type="text"
        value={note}
        onChange={(e) => setNote(e.target.value)}
        placeholder="Catatan (opsional, akan tercatat di history)"
        className="w-full rounded-md border border-stone-300 px-3 py-2.5 text-sm outline-none focus:border-rose-500"
      />
      <div className="flex flex-col gap-2 sm:flex-row sm:flex-wrap">
        {nextSteps.map((step) => (
          <button
            key={step.to}
            type="button"
            disabled={pending}
            onClick={() => go(step.to)}
            className="inline-flex min-h-[44px] w-full items-center justify-center rounded-full bg-rose-900 px-4 text-sm font-semibold text-white transition hover:bg-rose-800 disabled:bg-stone-400 sm:w-auto sm:text-xs"
          >
            {pending ? "..." : step.label}
          </button>
        ))}
        {canCancel ? (
          <button
            type="button"
            disabled={pending}
            onClick={() => go("CANCELLED", "Yakin batalkan pesanan ini?")}
            className="inline-flex min-h-[44px] w-full items-center justify-center rounded-full border border-rose-300 px-4 text-sm font-semibold text-rose-700 transition hover:bg-rose-50 disabled:opacity-50 sm:w-auto sm:text-xs"
          >
            Batalkan
          </button>
        ) : null}
        {canRefund ? (
          <button
            type="button"
            disabled={pending}
            onClick={() => go("REFUNDED", "Tandai pesanan sebagai REFUNDED? Pastikan refund sudah diproses di Midtrans.")}
            className="inline-flex min-h-[44px] w-full items-center justify-center rounded-full border border-amber-300 px-4 text-sm font-semibold text-amber-800 transition hover:bg-amber-50 disabled:opacity-50 sm:w-auto sm:text-xs"
          >
            Tandai refund
          </button>
        ) : null}
      </div>
      {error ? <p className="text-sm font-semibold text-rose-700">{error}</p> : null}
    </div>
  );
}
