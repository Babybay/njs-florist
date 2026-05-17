"use client";

import { useState, useTransition } from "react";
import { addToCartFormAction } from "@/server/actions/cart.actions";
import { formatIDR } from "@/lib/money";

type Variant = {
  id: string;
  name: string;
  size: string | null;
  wrapper: string | null;
  priceAdjust: number;
  availability: number;
};

type Addon = {
  id: string;
  name: string;
  price: number;
};

type Props = {
  productId: string;
  basePrice: number;
  variants: Variant[];
  addons: Addon[];
};

export function AddToCartForm({ productId, basePrice, variants, addons }: Props) {
  const firstInStock = variants.find((v) => v.availability > 0) ?? variants[0];
  const [variantId, setVariantId] = useState<string>(firstInStock?.id ?? "");
  const [quantity, setQuantity] = useState(1);
  const [selectedAddons, setSelectedAddons] = useState<Set<string>>(new Set());
  const [cardMessage, setCardMessage] = useState("");
  const [pending, startTransition] = useTransition();
  const [error, setError] = useState<string | null>(null);
  const [added, setAdded] = useState(false);

  const selectedVariant = variants.find((v) => v.id === variantId);
  const maxQty = selectedVariant?.availability ?? 0;
  const outOfStock = !selectedVariant || maxQty === 0;

  function toggleAddon(id: string) {
    setSelectedAddons((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  }

  function submit() {
    if (!selectedVariant || quantity < 1 || quantity > maxQty) return;
    setError(null);
    setAdded(false);
    startTransition(async () => {
      try {
        const fd = new FormData();
        fd.set("productId", productId);
        fd.set("variantId", variantId);
        fd.set("quantity", String(quantity));
        if (cardMessage.trim()) fd.set("cardMessage", cardMessage.trim());
        for (const id of selectedAddons) fd.append("addonId", id);
        await addToCartFormAction(fd);
        setAdded(true);
      } catch (err) {
        setError(err instanceof Error ? err.message : "Gagal menambahkan ke keranjang.");
      }
    });
  }

  return (
    <div className="grid gap-7">
      <FormSection label="Pilih varian">
        <div className="grid gap-2.5">
          {variants.map((variant) => {
            const isSelected = variant.id === variantId;
            const isAvailable = variant.availability > 0;
            return (
              <label
                key={variant.id}
                className={`group flex cursor-pointer flex-col gap-2 rounded-[3px] border bg-[color:var(--paper)] px-4 py-3.5 transition sm:flex-row sm:items-center sm:justify-between ${
                  isSelected
                    ? "border-[color:var(--ink)] shadow-[inset_0_0_0_1px_var(--ink)]"
                    : "border-[color:var(--rule-strong)] hover:border-[color:var(--ink)]/60"
                } ${!isAvailable ? "opacity-55" : ""}`}
              >
                <div className="flex items-center gap-3">
                  <input
                    type="radio"
                    name="variant"
                    value={variant.id}
                    checked={isSelected}
                    disabled={!isAvailable}
                    onChange={() => {
                      setVariantId(variant.id);
                      setQuantity(1);
                    }}
                    className="h-4 w-4 accent-[color:var(--ink)]"
                  />
                  <div>
                    <p className="text-[14px] font-semibold text-[color:var(--ink)]">{variant.name}</p>
                    <p className="text-[11.5px] uppercase tracking-[0.16em] text-[color:var(--ink-muted)]">
                      {[variant.size, variant.wrapper].filter(Boolean).join(" · ") || "Standar"}
                      {" · "}
                      {isAvailable ? `Sisa ${variant.availability}` : "Stok habis"}
                    </p>
                  </div>
                </div>
                <p className="text-[14px] font-semibold text-[color:var(--ink)]">
                  {formatIDR(basePrice + variant.priceAdjust)}
                </p>
              </label>
            );
          })}
        </div>
      </FormSection>

      {addons.length > 0 ? (
        <FormSection label="Add-on">
          <div className="grid gap-2 sm:grid-cols-2">
            {addons.map((addon) => {
              const checked = selectedAddons.has(addon.id);
              return (
                <label
                  key={addon.id}
                  className={`flex cursor-pointer items-center justify-between gap-3 rounded-[3px] border bg-[color:var(--paper)] px-3.5 py-3 text-[13px] transition ${
                    checked
                      ? "border-[color:var(--ink)] shadow-[inset_0_0_0_1px_var(--ink)]"
                      : "border-[color:var(--rule-strong)] hover:border-[color:var(--ink)]/60"
                  }`}
                >
                  <span className="flex items-center gap-3">
                    <input
                      type="checkbox"
                      checked={checked}
                      onChange={() => toggleAddon(addon.id)}
                      className="h-4 w-4 accent-[color:var(--ink)]"
                    />
                    <span className="font-semibold text-[color:var(--ink)]">{addon.name}</span>
                  </span>
                  <span className="text-[color:var(--ink-soft)]">{formatIDR(addon.price)}</span>
                </label>
              );
            })}
          </div>
        </FormSection>
      ) : null}

      <FormSection label="Pesan kartu (opsional)">
        <textarea
          rows={3}
          value={cardMessage}
          onChange={(event) => setCardMessage(event.target.value)}
          maxLength={300}
          className="w-full rounded-[3px] border border-[color:var(--rule-strong)] bg-[color:var(--paper)] px-3.5 py-3 text-[13px] leading-[1.6] text-[color:var(--ink)] placeholder:text-[color:var(--ink-muted)] focus:border-[color:var(--ink)] focus:outline-none"
          placeholder="Ucapan singkat untuk penerima…"
        />
        <p className="mt-1 text-right text-[11px] tracking-[0.14em] text-[color:var(--ink-muted)]">
          {cardMessage.length}/300
        </p>
      </FormSection>

      <div className="grid gap-3 border-t border-[color:var(--rule)] pt-6 sm:grid-cols-[auto_1fr] sm:items-center">
        <div className="inline-flex items-center rounded-full border border-[color:var(--rule-strong)] bg-[color:var(--paper)]">
          <button
            type="button"
            onClick={() => setQuantity((q) => Math.max(1, q - 1))}
            disabled={outOfStock || quantity <= 1}
            aria-label="Kurangi jumlah"
            className="grid h-11 w-11 place-items-center text-[color:var(--ink)] transition hover:text-[color:var(--ink-soft)] disabled:opacity-30"
          >
            −
          </button>
          <input
            type="number"
            min={1}
            max={Math.max(maxQty, 1)}
            value={quantity}
            onChange={(event) => setQuantity(Math.max(1, Number(event.target.value) || 1))}
            disabled={outOfStock}
            aria-label="Jumlah"
            className="h-11 w-12 border-0 bg-transparent text-center text-sm font-semibold text-[color:var(--ink)] focus:outline-none"
          />
          <button
            type="button"
            onClick={() => setQuantity((q) => Math.min(maxQty, q + 1))}
            disabled={outOfStock || quantity >= maxQty}
            aria-label="Tambah jumlah"
            className="grid h-11 w-11 place-items-center text-[color:var(--ink)] transition hover:text-[color:var(--ink-soft)] disabled:opacity-30"
          >
            +
          </button>
        </div>
        <button
          type="button"
          onClick={submit}
          disabled={pending || outOfStock || quantity > maxQty}
          className="nf-btn nf-btn--outline w-full disabled:opacity-50 sm:w-auto"
        >
          {pending ? "Menambahkan…" : outOfStock ? "Stok habis" : "Tambah ke keranjang →"}
        </button>
      </div>
      {added ? (
        <p className="text-sm font-medium text-emerald-700">
          ✓ Ditambahkan ke keranjang. <a href="/cart" className="underline underline-offset-4">Lihat keranjang →</a>
        </p>
      ) : null}
      {error ? <p className="text-sm font-semibold text-rose-700">{error}</p> : null}
    </div>
  );
}

function FormSection({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div>
      <p className="mb-3 text-[10.5px] font-semibold uppercase tracking-[0.28em] text-[color:var(--ink-muted)]">
        {label}
      </p>
      {children}
    </div>
  );
}
