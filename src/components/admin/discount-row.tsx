"use client";

import { useState, useTransition } from "react";
import { formatIDR } from "@/lib/money";
import {
  toggleDiscountAction,
  updateDiscountAction,
} from "@/server/actions/discount.actions";
import { Button, inputClass, tagClass } from "@/components/admin/ui";

type Discount = {
  id: string;
  code: string;
  type: string;
  value: number;
  minSpend: number | null;
  maxUses: number | null;
  usedCount: number;
  startsAt: Date | null;
  endsAt: Date | null;
  isActive: boolean;
};

function toDateInput(d: Date | null): string {
  if (!d) return "";
  return new Date(d).toISOString().slice(0, 10);
}

export function DiscountRow({ discount }: { discount: Discount }) {
  const [pending, startTransition] = useTransition();
  const [error, setError] = useState<string | null>(null);
  const [editing, setEditing] = useState(false);

  function runUpdate(formData: FormData) {
    setError(null);
    startTransition(async () => {
      try {
        await updateDiscountAction(formData);
        setEditing(false);
      } catch (err) {
        setError(err instanceof Error ? err.message : "Gagal menyimpan.");
      }
    });
  }

  function runToggle() {
    const fd = new FormData();
    fd.set("id", discount.id);
    fd.set("next", String(!discount.isActive));
    startTransition(async () => {
      try {
        await toggleDiscountAction(fd);
      } catch (err) {
        setError(err instanceof Error ? err.message : "Gagal toggle.");
      }
    });
  }

  const valueLabel =
    discount.type === "PERCENT" ? `${discount.value}%` : formatIDR(discount.value);
  const usageLabel = discount.maxUses
    ? `${discount.usedCount}/${discount.maxUses}`
    : `${discount.usedCount}× dipakai`;

  return (
    <article className="rounded-lg border border-stone-200/80 bg-white p-4 transition hover:border-stone-300">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div className="min-w-0">
          <div className="flex flex-wrap items-center gap-2">
            <p className="font-mono text-base font-medium text-stone-900">{discount.code}</p>
            <span className={tagClass("rose")}>{valueLabel}</span>
            <span className={tagClass(discount.isActive ? "emerald" : "neutral")}>
              {discount.isActive ? "Aktif" : "Nonaktif"}
            </span>
          </div>
          <p className="mt-0.5 text-xs text-stone-500">
            {discount.minSpend ? `Min ${formatIDR(discount.minSpend)} · ` : ""}
            {usageLabel}
            {discount.endsAt
              ? ` · Berakhir ${new Date(discount.endsAt).toLocaleDateString("id-ID")}`
              : ""}
          </p>
        </div>
        <div className="flex shrink-0 flex-wrap gap-1.5">
          <Button type="button" variant="ghost" onClick={() => setEditing(!editing)}>
            {editing ? "Tutup" : "Edit"}
          </Button>
          <Button type="button" variant="secondary" disabled={pending} onClick={runToggle}>
            {discount.isActive ? "Nonaktifkan" : "Aktifkan"}
          </Button>
        </div>
      </div>

      {editing ? (
        <form
          action={(fd) => {
            fd.set("id", discount.id);
            runUpdate(fd);
          }}
          className="mt-3 grid gap-2 rounded-md bg-stone-50/70 p-3 sm:grid-cols-2 lg:grid-cols-4"
        >
          <input name="code" defaultValue={discount.code} className={inputClass("uppercase")} />
          <select name="type" defaultValue={discount.type} className={inputClass()}>
            <option value="PERCENT">Persen</option>
            <option value="FIXED">Nominal</option>
          </select>
          <input name="value" type="number" min={1} defaultValue={discount.value} className={inputClass()} />
          <input name="minSpend" type="number" min={0} defaultValue={discount.minSpend ?? ""} placeholder="Min belanja" className={inputClass()} />
          <input name="maxUses" type="number" min={1} defaultValue={discount.maxUses ?? ""} placeholder="Maks pemakaian" className={inputClass()} />
          <input name="startsAt" type="date" defaultValue={toDateInput(discount.startsAt)} className={inputClass()} />
          <input name="endsAt" type="date" defaultValue={toDateInput(discount.endsAt)} className={inputClass()} />
          <label className="flex items-center gap-2 text-sm text-stone-700">
            <input type="checkbox" name="isActive" defaultChecked={discount.isActive} />
            Aktif
          </label>
          <Button type="submit" variant="primary" disabled={pending} className="sm:col-span-2 lg:col-span-4">
            {pending ? "Menyimpan..." : "Simpan"}
          </Button>
        </form>
      ) : null}

      {error ? <p className="mt-2 text-xs font-medium text-rose-700">{error}</p> : null}
    </article>
  );
}
