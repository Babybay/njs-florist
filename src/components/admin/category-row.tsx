"use client";

import { useState, useTransition } from "react";
import {
  deleteCategoryAction,
  updateCategoryAction,
} from "@/server/actions/category.actions";
import { Button, inputClass, tagClass } from "@/components/admin/ui";

type Category = {
  id: string;
  name: string;
  slug: string;
  description: string | null;
  imageUrl: string | null;
  productCount: number;
};

export function CategoryRow({ category }: { category: Category }) {
  const [pending, startTransition] = useTransition();
  const [error, setError] = useState<string | null>(null);
  const [editing, setEditing] = useState(false);

  function runUpdate(formData: FormData) {
    setError(null);
    startTransition(async () => {
      try {
        await updateCategoryAction(formData);
        setEditing(false);
      } catch (err) {
        setError(err instanceof Error ? err.message : "Gagal menyimpan.");
      }
    });
  }

  function runDelete() {
    if (!confirm(`Hapus kategori "${category.name}"?`)) return;
    setError(null);
    const fd = new FormData();
    fd.set("id", category.id);
    startTransition(async () => {
      try {
        await deleteCategoryAction(fd);
      } catch (err) {
        setError(err instanceof Error ? err.message : "Gagal menghapus.");
      }
    });
  }

  return (
    <article className="rounded-lg border border-stone-200/80 bg-white p-4 transition hover:border-stone-300">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
        <div className="min-w-0">
          <div className="flex flex-wrap items-center gap-2">
            <p className="font-medium text-stone-900">{category.name}</p>
            <span className={tagClass("neutral")}>{category.productCount} produk</span>
          </div>
          <p className="mt-0.5 font-mono text-xs text-stone-500">/{category.slug}</p>
          {category.description ? (
            <p className="mt-1.5 text-sm leading-6 text-stone-600">{category.description}</p>
          ) : null}
        </div>
        <div className="flex shrink-0 flex-wrap gap-1.5">
          <Button type="button" variant="ghost" onClick={() => setEditing(!editing)}>
            {editing ? "Tutup" : "Edit"}
          </Button>
          <Button
            type="button"
            variant="danger"
            disabled={pending || category.productCount > 0}
            onClick={runDelete}
            title={category.productCount > 0 ? "Pindahkan produk dulu sebelum hapus" : ""}
          >
            Hapus
          </Button>
        </div>
      </div>

      {editing ? (
        <form
          action={(fd) => {
            fd.set("id", category.id);
            runUpdate(fd);
          }}
          className="mt-3 grid gap-2 rounded-md bg-stone-50/70 p-3 sm:grid-cols-2"
        >
          <input name="name" defaultValue={category.name} className={inputClass()} />
          <input name="slug" defaultValue={category.slug} className={inputClass("font-mono")} />
          <input
            name="description"
            defaultValue={category.description ?? ""}
            placeholder="Deskripsi"
            className={inputClass("sm:col-span-2")}
          />
          <input
            name="imageUrl"
            type="url"
            defaultValue={category.imageUrl ?? ""}
            placeholder="URL gambar header"
            className={inputClass("sm:col-span-2")}
          />
          <Button type="submit" variant="primary" disabled={pending} className="sm:col-span-2">
            {pending ? "Menyimpan..." : "Simpan"}
          </Button>
        </form>
      ) : null}

      {error ? <p className="mt-2 text-xs font-medium text-rose-700">{error}</p> : null}
    </article>
  );
}
