"use client";

import { useState, useTransition } from "react";
import { createCategoryAction } from "@/server/actions/category.actions";
import { Button, inputClass } from "@/components/admin/ui";

function slugify(s: string) {
  return s
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-|-$/g, "");
}

export function CategoryCreateForm() {
  const [pending, startTransition] = useTransition();
  const [error, setError] = useState<string | null>(null);
  const [name, setName] = useState("");
  const [slug, setSlug] = useState("");
  const [slugTouched, setSlugTouched] = useState(false);

  function submit(formData: FormData) {
    setError(null);
    startTransition(async () => {
      try {
        await createCategoryAction(formData);
        setName("");
        setSlug("");
        setSlugTouched(false);
        const form = document.getElementById("cat-create-form") as HTMLFormElement | null;
        form?.reset();
      } catch (err) {
        setError(err instanceof Error ? err.message : "Gagal membuat kategori.");
      }
    });
  }

  return (
    <form
      id="cat-create-form"
      action={submit}
      className="grid gap-2.5 rounded-lg border border-stone-200/80 bg-white p-4 sm:grid-cols-2"
    >
      <input
        name="name"
        required
        value={name}
        onChange={(e) => {
          setName(e.target.value);
          if (!slugTouched) setSlug(slugify(e.target.value));
        }}
        placeholder="Nama kategori"
        className={inputClass()}
      />
      <input
        name="slug"
        required
        value={slug}
        onChange={(e) => {
          setSlug(e.target.value);
          setSlugTouched(true);
        }}
        placeholder="slug-kategori"
        className={inputClass("font-mono")}
      />
      <input
        name="description"
        placeholder="Deskripsi singkat (opsional)"
        className={inputClass("sm:col-span-2")}
      />
      <input
        name="imageUrl"
        type="url"
        placeholder="URL gambar header (opsional)"
        className={inputClass("sm:col-span-2")}
      />
      <Button type="submit" disabled={pending} variant="primary" className="sm:col-span-2">
        {pending ? "Menyimpan..." : "Tambah kategori"}
      </Button>
      {error ? <p className="text-xs font-medium text-rose-700 sm:col-span-2">{error}</p> : null}
    </form>
  );
}
