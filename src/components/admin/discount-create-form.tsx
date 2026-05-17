"use client";

import { useState, useTransition } from "react";
import { createDiscountAction } from "@/server/actions/discount.actions";
import { Button, inputClass } from "@/components/admin/ui";

export function DiscountCreateForm() {
  const [pending, startTransition] = useTransition();
  const [error, setError] = useState<string | null>(null);
  const [type, setType] = useState<"PERCENT" | "FIXED">("PERCENT");

  function submit(formData: FormData) {
    setError(null);
    startTransition(async () => {
      try {
        await createDiscountAction(formData);
        const form = document.getElementById("disc-create-form") as HTMLFormElement | null;
        form?.reset();
        setType("PERCENT");
      } catch (err) {
        setError(err instanceof Error ? err.message : "Gagal membuat kode.");
      }
    });
  }

  return (
    <form
      id="disc-create-form"
      action={submit}
      className="grid gap-2.5 rounded-lg border border-stone-200/80 bg-white p-4 sm:grid-cols-2 lg:grid-cols-4"
    >
      <input
        name="code"
        required
        placeholder="CODE (mis. WELCOME10)"
        className={inputClass("uppercase")}
      />
      <select
        name="type"
        value={type}
        onChange={(e) => setType(e.target.value as "PERCENT" | "FIXED")}
        className={inputClass()}
      >
        <option value="PERCENT">Persen (%)</option>
        <option value="FIXED">Nominal (IDR)</option>
      </select>
      <input
        name="value"
        type="number"
        min={1}
        required
        placeholder={type === "PERCENT" ? "Mis. 10" : "Mis. 50000"}
        className={inputClass()}
      />
      <input
        name="minSpend"
        type="number"
        min={0}
        placeholder="Min belanja (opsional)"
        className={inputClass()}
      />
      <input
        name="maxUses"
        type="number"
        min={1}
        placeholder="Maks pemakaian (opsional)"
        className={inputClass()}
      />
      <input name="startsAt" type="date" className={inputClass()} />
      <input name="endsAt" type="date" className={inputClass()} />
      <label className="flex items-center gap-2 text-sm text-stone-700">
        <input type="checkbox" name="isActive" defaultChecked />
        Aktif
      </label>
      <Button type="submit" disabled={pending} variant="primary" className="sm:col-span-2 lg:col-span-4">
        {pending ? "Menyimpan..." : "Tambah kode"}
      </Button>
      {error ? <p className="text-xs font-medium text-rose-700 sm:col-span-2 lg:col-span-4">{error}</p> : null}
    </form>
  );
}
