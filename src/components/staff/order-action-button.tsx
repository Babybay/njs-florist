"use client";

import { useState, useTransition } from "react";
import {
  deliveryTransitionAction,
  floristTransitionAction,
} from "@/server/actions/order-status.actions";
import type { OrderStatus } from "@/types/order";

type Variant = "primary" | "ghost";

export function OrderActionButton({
  orderId,
  toStatus,
  label,
  scope,
  variant = "primary",
  requiresNote = false,
}: {
  orderId: string;
  toStatus: OrderStatus;
  label: string;
  scope: "florist" | "delivery";
  variant?: Variant;
  requiresNote?: boolean;
}) {
  const [pending, startTransition] = useTransition();
  const [error, setError] = useState<string | null>(null);
  const [note, setNote] = useState("");
  const [showNote, setShowNote] = useState(false);

  function submit() {
    setError(null);
    const fd = new FormData();
    fd.set("orderId", orderId);
    fd.set("toStatus", toStatus);
    if (note) fd.set("note", note);
    startTransition(async () => {
      try {
        const action =
          scope === "florist" ? floristTransitionAction : deliveryTransitionAction;
        await action(fd);
        setNote("");
        setShowNote(false);
      } catch (err) {
        setError(err instanceof Error ? err.message : "Aksi gagal.");
      }
    });
  }

  const base =
    "inline-flex items-center justify-center px-4 py-2 text-[11px] font-semibold uppercase tracking-[0.14em] transition disabled:cursor-not-allowed disabled:opacity-60";
  const styles =
    variant === "primary"
      ? "bg-black text-white hover:bg-[color:var(--blush-strong)] hover:text-black"
      : "border border-stone-300 text-black hover:border-black";

  if (requiresNote && !showNote) {
    return (
      <button
        type="button"
        onClick={() => setShowNote(true)}
        className={`${base} ${styles}`}
      >
        {label}
      </button>
    );
  }

  return (
    <div className="flex flex-col gap-2">
      {requiresNote ? (
        <input
          value={note}
          onChange={(event) => setNote(event.target.value)}
          placeholder="Catatan (opsional)"
          className="rounded-md border border-stone-300 px-3 py-2 text-xs outline-none focus:border-black"
        />
      ) : null}
      <div className="flex flex-wrap gap-2">
        <button
          type="button"
          disabled={pending}
          onClick={submit}
          className={`${base} ${styles}`}
        >
          {pending ? "..." : label}
        </button>
        {requiresNote ? (
          <button
            type="button"
            onClick={() => {
              setShowNote(false);
              setNote("");
            }}
            className="inline-flex items-center justify-center px-3 py-2 text-[11px] font-semibold uppercase tracking-[0.14em] text-black/65 transition hover:bg-[color:var(--blush)] hover:text-black"
          >
            Batal
          </button>
        ) : null}
      </div>
      {error ? <p className="text-xs font-semibold text-rose-700">{error}</p> : null}
    </div>
  );
}
