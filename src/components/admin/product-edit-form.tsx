"use client";

import { useActionState, useEffect } from "react";
import {
  type AdminFormState,
  updateProductAction,
} from "@/server/actions/product.actions";
import { useAdminFormMemory } from "@/components/admin/use-admin-form-memory";

type Product = {
  id: string;
  name: string;
  slug: string;
  description: string;
  basePrice: number;
  categoryId: string;
  status: "DRAFT" | "ACTIVE" | "ARCHIVED";
  isSameDayEligible: boolean;
};

const initialState: AdminFormState = {};

export function ProductEditForm({
  product,
  categories,
}: {
  product: Product;
  categories: Array<{ id: string; name: string }>;
}) {
  const [state, formAction, pending] = useActionState(updateProductAction, initialState);
  const { formRef, hasMemory, saveMemory, clearMemory } = useAdminFormMemory(`admin-form:product:${product.id}`);

  useEffect(() => {
    if (state.ok) clearMemory();
  }, [clearMemory, state.ok]);

  return (
    <form
      ref={formRef}
      action={formAction}
      onInput={saveMemory}
      onChange={saveMemory}
      onSubmit={saveMemory}
      className="grid gap-5 rounded-lg border border-stone-200 bg-white p-6 shadow-sm"
    >
      <input type="hidden" name="id" value={product.id} />
      {hasMemory ? (
        <div className="flex flex-wrap items-center justify-between gap-2 rounded-md border border-amber-200 bg-amber-50 px-3 py-2 text-xs text-amber-900">
          <span>Draft edit sebelumnya dipulihkan. Perbaiki field yang error tanpa mengulang dari awal.</span>
          <button type="button" onClick={clearMemory} className="font-semibold hover:underline">
            Buang draft
          </button>
        </div>
      ) : null}

      <div className="grid gap-4 sm:grid-cols-2">
        <label className="grid gap-2 text-sm font-semibold text-stone-800">
          Nama
          <input
            name="name"
            defaultValue={product.name}
            required
            className="rounded-md border border-stone-300 px-3 py-3 font-normal outline-none focus:border-rose-500"
          />
        </label>
        <label className="grid gap-2 text-sm font-semibold text-stone-800">
          Slug
          <input
            name="slug"
            defaultValue={product.slug}
            required
            className="rounded-md border border-stone-300 px-3 py-3 font-normal outline-none focus:border-rose-500"
          />
        </label>
        <label className="grid gap-2 text-sm font-semibold text-stone-800">
          Kategori
          <select
            name="categoryId"
            defaultValue={product.categoryId}
            required
            className="rounded-md border border-stone-300 px-3 py-3 font-normal outline-none focus:border-rose-500"
          >
            {categories.map((c) => (
              <option key={c.id} value={c.id}>
                {c.name}
              </option>
            ))}
          </select>
        </label>
        <label className="grid gap-2 text-sm font-semibold text-stone-800">
          Harga dasar (IDR)
          <input
            type="number"
            min={0}
            name="basePrice"
            defaultValue={product.basePrice}
            required
            className="rounded-md border border-stone-300 px-3 py-3 font-normal outline-none focus:border-rose-500"
          />
        </label>
        <label className="grid gap-2 text-sm font-semibold text-stone-800">
          Status
          <select
            name="status"
            defaultValue={product.status}
            className="rounded-md border border-stone-300 px-3 py-3 font-normal outline-none focus:border-rose-500"
          >
            <option value="DRAFT">DRAFT</option>
            <option value="ACTIVE">ACTIVE</option>
            <option value="ARCHIVED">ARCHIVED</option>
          </select>
        </label>
        <label className="flex items-end gap-2 text-sm font-semibold text-stone-700">
          <input
            type="checkbox"
            name="isSameDayEligible"
            defaultChecked={product.isSameDayEligible}
            className="h-4 w-4 accent-rose-700"
          />
          Same-day eligible
        </label>
      </div>

      <label className="grid gap-2 text-sm font-semibold text-stone-800">
        Deskripsi
        <textarea
          name="description"
          defaultValue={product.description}
          required
          rows={4}
          className="rounded-md border border-stone-300 px-3 py-3 font-normal outline-none focus:border-rose-500"
        />
      </label>

      {state.error ? (
        <p className="rounded-md bg-rose-50 px-3 py-2 text-sm font-semibold text-rose-700">
          {state.error}
        </p>
      ) : null}
      {state.ok ? (
        <p className="rounded-md bg-emerald-50 px-3 py-2 text-sm font-semibold text-emerald-700">
          Tersimpan.
        </p>
      ) : null}

      <button
        type="submit"
        disabled={pending}
        className="self-start rounded-full bg-rose-900 px-6 py-3 text-sm font-semibold text-white transition hover:bg-rose-800 disabled:bg-stone-400"
      >
        {pending ? "Menyimpan..." : "Simpan perubahan"}
      </button>
    </form>
  );
}
