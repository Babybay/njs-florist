"use client";

import Image from "next/image";
import { useState, useTransition } from "react";
import { updateHomepageSlotAction } from "@/server/actions/homepage.actions";

type SignatureResponse = {
  folder: string;
  timestamp: number;
  signature: string;
  cloudName: string;
  apiKey: string;
};

async function uploadToCloudinary(file: File): Promise<string> {
  const sigRes = await fetch("/api/upload/cloudinary-signature", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ folder: "njs-florist/homepage" }),
  });
  if (!sigRes.ok) throw new Error("Gagal mendapatkan signature upload.");
  const sig: SignatureResponse = await sigRes.json();
  if (!sig.cloudName || !sig.apiKey) {
    throw new Error("CLOUDINARY_CLOUD_NAME / CLOUDINARY_API_KEY belum diset di server.");
  }

  const form = new FormData();
  form.set("file", file);
  form.set("api_key", sig.apiKey);
  form.set("timestamp", String(sig.timestamp));
  form.set("folder", sig.folder);
  form.set("signature", sig.signature);

  const res = await fetch(`https://api.cloudinary.com/v1_1/${sig.cloudName}/image/upload`, {
    method: "POST",
    body: form,
  });
  if (!res.ok) throw new Error(`Cloudinary upload gagal (${res.status}).`);
  const body = (await res.json()) as { secure_url?: string };
  if (!body.secure_url) throw new Error("Cloudinary tidak mengembalikan URL.");
  return body.secure_url;
}

export type HomepageSlotField = {
  key: string;
  label: string;
  value: string;
  multiline?: boolean;
  hint?: string;
};

export function HomepageSlot({
  title,
  description,
  aspect,
  imageKey,
  imageValue,
  fields = [],
}: {
  title: string;
  description: string;
  aspect: "portrait" | "landscape" | "square";
  imageKey: string;
  imageValue: string;
  fields?: HomepageSlotField[];
}) {
  const [pending, startTransition] = useTransition();
  const [error, setError] = useState<string | null>(null);
  const [message, setMessage] = useState<string | null>(null);
  const [uploading, setUploading] = useState(false);
  const [draftUrl, setDraftUrl] = useState(imageValue);
  const [drafts, setDrafts] = useState<Record<string, string>>(() =>
    Object.fromEntries(fields.map((f) => [f.key, f.value])),
  );

  const aspectClass =
    aspect === "portrait" ? "aspect-[3/4]" : aspect === "landscape" ? "aspect-[16/9]" : "aspect-square";

  async function onPick(event: React.ChangeEvent<HTMLInputElement>) {
    const file = event.target.files?.[0];
    if (!file) return;
    setError(null);
    setMessage(null);
    setUploading(true);
    try {
      const url = await uploadToCloudinary(file);
      setDraftUrl(url);
      setMessage("Gambar terunggah — klik Simpan untuk publish.");
      event.target.value = "";
    } catch (err) {
      setError(err instanceof Error ? err.message : "Upload gagal.");
    } finally {
      setUploading(false);
    }
  }

  function save() {
    setError(null);
    setMessage(null);
    startTransition(async () => {
      try {
        const payload: Record<string, string> = { [imageKey]: draftUrl };
        for (const f of fields) payload[f.key] = drafts[f.key] ?? "";
        await updateHomepageSlotAction(payload);
        setMessage("Tersimpan & landing page direvalidasi.");
      } catch (err) {
        setError(err instanceof Error ? err.message : "Gagal menyimpan.");
      }
    });
  }

  const dirty =
    draftUrl !== imageValue ||
    fields.some((f) => (drafts[f.key] ?? "") !== f.value);

  return (
    <section className="overflow-hidden rounded-lg border border-stone-200/80 bg-white">
      <div className="flex flex-wrap items-center justify-between gap-2 border-b border-stone-200/80 px-5 py-3">
        <div>
          <h2 className="text-sm font-semibold text-stone-900">{title}</h2>
          <p className="text-xs text-stone-500">{description}</p>
        </div>
        <span className="rounded-full bg-stone-100 px-2.5 py-1 text-[11px] font-medium text-stone-600">
          {aspect === "portrait" ? "Potret 3:4" : aspect === "landscape" ? "Lanskap 16:9" : "Persegi 1:1"}
        </span>
      </div>

      <div className="grid gap-5 p-5 md:grid-cols-[260px_1fr]">
        <div className="space-y-2">
          <div className={`relative ${aspectClass} w-full overflow-hidden rounded-md border border-stone-200 bg-stone-100`}>
            {draftUrl ? (
              <Image
                src={draftUrl}
                alt={title}
                fill
                sizes="260px"
                className="object-cover"
                unoptimized={!isAllowedHost(draftUrl)}
              />
            ) : (
              <div className="grid h-full place-items-center text-xs text-stone-400">Belum ada gambar</div>
            )}
            {uploading ? (
              <div className="absolute inset-0 grid place-items-center bg-white/70 text-xs font-medium text-stone-700">
                Mengunggah…
              </div>
            ) : null}
          </div>
          <label className="block cursor-pointer">
            <span className="inline-flex w-full items-center justify-center gap-2 rounded-md border border-stone-300 bg-white px-3 py-2 text-xs font-semibold text-stone-800 transition hover:bg-stone-50">
              {uploading ? "Mengunggah…" : "Pilih gambar baru"}
            </span>
            <input
              type="file"
              accept="image/*"
              onChange={onPick}
              disabled={uploading || pending}
              className="hidden"
            />
          </label>
          <p className="text-[11px] text-stone-500">
            JPEG/PNG, max ~10MB. Disimpan ke Cloudinary folder <code className="rounded bg-stone-100 px-1 py-0.5 text-[10px]">njs-florist/homepage</code>.
          </p>
        </div>

        <div className="grid gap-3">
          <label className="grid gap-1.5 text-xs font-medium text-stone-700">
            <span>URL gambar (atau paste manual)</span>
            <input
              type="url"
              value={draftUrl}
              onChange={(e) => setDraftUrl(e.target.value)}
              placeholder="https://…"
              className="w-full rounded-md border border-stone-200 bg-white px-3 py-2 text-sm text-stone-900 placeholder:text-stone-400 transition focus:border-stone-400 focus:outline-none focus:ring-2 focus:ring-stone-200/70"
            />
          </label>

          {fields.map((f) => (
            <label key={f.key} className="grid gap-1.5 text-xs font-medium text-stone-700">
              <span>{f.label}</span>
              {f.multiline ? (
                <textarea
                  value={drafts[f.key] ?? ""}
                  onChange={(e) => setDrafts((d) => ({ ...d, [f.key]: e.target.value }))}
                  rows={3}
                  className="w-full rounded-md border border-stone-200 bg-white px-3 py-2 text-sm text-stone-900 placeholder:text-stone-400 transition focus:border-stone-400 focus:outline-none focus:ring-2 focus:ring-stone-200/70"
                />
              ) : (
                <input
                  type="text"
                  value={drafts[f.key] ?? ""}
                  onChange={(e) => setDrafts((d) => ({ ...d, [f.key]: e.target.value }))}
                  className="w-full rounded-md border border-stone-200 bg-white px-3 py-2 text-sm text-stone-900 placeholder:text-stone-400 transition focus:border-stone-400 focus:outline-none focus:ring-2 focus:ring-stone-200/70"
                />
              )}
              {f.hint ? <span className="text-[11px] text-stone-500">{f.hint}</span> : null}
            </label>
          ))}

          <div className="flex flex-wrap items-center gap-3 pt-1">
            <button
              type="button"
              onClick={save}
              disabled={pending || uploading || !dirty}
              className="inline-flex items-center justify-center gap-1.5 rounded-md bg-stone-900 px-3 py-1.5 text-sm font-medium text-white transition hover:bg-stone-800 disabled:cursor-not-allowed disabled:opacity-50"
            >
              {pending ? "Menyimpan…" : "Simpan slot"}
            </button>
            {message ? <p className="text-xs font-medium text-emerald-700">{message}</p> : null}
            {error ? <p className="text-xs font-medium text-rose-700">{error}</p> : null}
            {dirty && !pending && !message && !error ? (
              <p className="text-xs text-stone-500">Ada perubahan belum disimpan.</p>
            ) : null}
          </div>
        </div>
      </div>
    </section>
  );
}

function isAllowedHost(url: string) {
  try {
    const u = new URL(url);
    return (
      u.hostname === "res.cloudinary.com" ||
      u.hostname === "images.unsplash.com" ||
      u.hostname.endsWith(".supabase.co")
    );
  } catch {
    return false;
  }
}
