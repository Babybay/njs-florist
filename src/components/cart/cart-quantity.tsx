"use client";

import { useEffect, useRef, useState, useTransition } from "react";
import { updateCartItemQuantityAction } from "@/server/actions/cart.actions";

/**
 * Stock-aware quantity stepper for a cart line. Mirrors the product page:
 * bounded by availability, with −/+ controls. Auto-saves (debounced) so there
 * is no separate "Update" button to forget. Surfaces stock errors inline.
 */
export function CartQuantity({
  itemId,
  cartId,
  quantity: initial,
  max,
}: {
  itemId: string;
  cartId: string;
  quantity: number;
  max: number;
}) {
  const [qty, setQty] = useState(initial);
  const [error, setError] = useState<string | null>(null);
  const [pending, startTransition] = useTransition();
  const skipNextSave = useRef(true);

  // Never force the value below what is already in the cart (stock may have
  // dropped since they added it); only cap how far they can increase.
  const effectiveMax = Math.max(max, initial);

  useEffect(() => {
    if (skipNextSave.current) {
      skipNextSave.current = false;
      return;
    }
    const timer = setTimeout(() => {
      const fd = new FormData();
      fd.set("itemId", itemId);
      fd.set("cartId", cartId);
      fd.set("quantity", String(qty));
      startTransition(async () => {
        try {
          await updateCartItemQuantityAction(fd);
          setError(null);
        } catch {
          setError(`Stok tersisa ${max}. Jumlah disesuaikan.`);
          setQty(Math.max(1, Math.min(qty, max)));
        }
      });
    }, 500);
    return () => clearTimeout(timer);
  }, [qty, itemId, cartId, max]);

  const atMax = qty >= effectiveMax;

  return (
    <div className="flex flex-col gap-1">
      <div className="flex items-center gap-2">
        <span className="text-[11px] font-semibold uppercase tracking-[0.14em] text-black/60">
          Qty
        </span>
        <div className="inline-flex items-center rounded-full border border-stone-300">
          <button
            type="button"
            onClick={() => setQty((q) => Math.max(1, q - 1))}
            disabled={pending || qty <= 1}
            aria-label="Kurangi jumlah"
            className="grid h-9 w-9 place-items-center text-black transition hover:text-black/60 disabled:opacity-30"
          >
            −
          </button>
          <input
            type="number"
            min={1}
            max={effectiveMax}
            value={qty}
            onChange={(e) =>
              setQty(Math.max(1, Math.min(effectiveMax, Number(e.target.value) || 1)))
            }
            aria-label="Jumlah"
            className="h-9 w-12 border-0 bg-transparent text-center text-sm font-semibold text-black focus:outline-none"
          />
          <button
            type="button"
            onClick={() => setQty((q) => Math.min(effectiveMax, q + 1))}
            disabled={pending || atMax}
            aria-label="Tambah jumlah"
            className="grid h-9 w-9 place-items-center text-black transition hover:text-black/60 disabled:opacity-30"
          >
            +
          </button>
        </div>
        {pending ? <span className="text-xs text-black/40">menyimpan…</span> : null}
      </div>
      {error ? (
        <p className="text-xs font-semibold text-rose-700">{error}</p>
      ) : atMax ? (
        <p className="text-xs text-black/45">Maks. stok: {effectiveMax}</p>
      ) : null}
    </div>
  );
}
