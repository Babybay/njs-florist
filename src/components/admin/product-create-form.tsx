"use client";

import { useActionState } from "react";
import {
  type AdminFormState,
  createProductAction,
} from "@/server/actions/product.actions";

const initialState: AdminFormState = {};

export function ProductCreateForm({
  categories,
}: {
  categories: Array<{ id: string; name: string }>;
}) {
  const [state, formAction, pending] = useActionState(createProductAction, initialState);

  return (
    <form action={formAction} className="grid gap-5 rounded-lg border border-stone-200 bg-white p-6 shadow-sm">
      <div className="grid gap-4 sm:grid-cols-2">
        <label className="grid gap-2 text-sm font-semibold text-stone-800">
          Nama produk *
          <input
            name="name"
            required
            className="rounded-md border border-stone-300 px-3 py-3 font-normal outline-none focus:border-rose-500"
          />
        </label>
        <label className="grid gap-2 text-sm font-semibold text-stone-800">
          Slug *
          <input
            name="slug"
            required
            placeholder="contoh-buket-mawar"
            className="rounded-md border border-stone-300 px-3 py-3 font-normal outline-none focus:border-rose-500"
          />
        </label>
        <label className="grid gap-2 text-sm font-semibold text-stone-800">
          Kategori *
          <select
            name="categoryId"
            required
            className="rounded-md border border-stone-300 px-3 py-3 font-normal outline-none focus:border-rose-500"
          >
            <option value="">Pilih kategori</option>
            {categories.map((c) => (
              <option key={c.id} value={c.id}>
                {c.name}
              </option>
            ))}
          </select>
        </label>
        <label className="grid gap-2 text-sm font-semibold text-stone-800">
          Harga dasar (IDR) *
          <input
            type="number"
            min={0}
            name="basePrice"
            required
            className="rounded-md border border-stone-300 px-3 py-3 font-normal outline-none focus:border-rose-500"
          />
        </label>
        <label className="grid gap-2 text-sm font-semibold text-stone-800">
          Status
          <select
            name="status"
            defaultValue="DRAFT"
            className="rounded-md border border-stone-300 px-3 py-3 font-normal outline-none focus:border-rose-500"
          >
            <option value="DRAFT">DRAFT</option>
            <option value="ACTIVE">ACTIVE</option>
            <option value="ARCHIVED">ARCHIVED</option>
          </select>
        </label>
        <label className="flex items-end gap-2 text-sm font-semibold text-stone-700">
          <input type="checkbox" name="isSameDayEligible" className="h-4 w-4 accent-rose-700" />
          Same-day eligible
        </label>
      </div>

      <label className="grid gap-2 text-sm font-semibold text-stone-800">
        Deskripsi *
        <textarea
          name="description"
          required
          rows={4}
          className="rounded-md border border-stone-300 px-3 py-3 font-normal outline-none focus:border-rose-500"
        />
      </label>

      <div className="grid gap-4 sm:grid-cols-2">
        <label className="grid gap-2 text-sm font-semibold text-stone-800">
          URL gambar utama (opsional)
          <input
            name="imageUrl"
            type="url"
            placeholder="https://res.cloudinary.com/..."
            className="rounded-md border border-stone-300 px-3 py-3 font-normal outline-none focus:border-rose-500"
          />
        </label>
        <label className="grid gap-2 text-sm font-semibold text-stone-800">
          Alt text gambar
          <input
            name="imageAlt"
            className="rounded-md border border-stone-300 px-3 py-3 font-normal outline-none focus:border-rose-500"
          />
        </label>
      </div>

      {state.error ? (
        <p className="rounded-md bg-rose-50 px-3 py-2 text-sm font-semibold text-rose-700">
          {state.error}
        </p>
      ) : null}

      <button
        type="submit"
        disabled={pending}
        className="self-start rounded-full bg-rose-900 px-6 py-3 text-sm font-semibold text-white transition hover:bg-rose-800 disabled:bg-stone-400"
      >
        {pending ? "Menyimpan..." : "Buat produk"}
      </button>
    </form>
  );
}
