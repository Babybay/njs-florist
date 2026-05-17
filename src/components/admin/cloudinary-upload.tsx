"use client";

import { useState, useTransition } from "react";
import { addProductImageAction } from "@/server/actions/product.actions";

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
    body: JSON.stringify({ folder: "njs-florist/products" }),
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

export function CloudinaryUpload({ productId }: { productId: string }) {
  const [pending, startTransition] = useTransition();
  const [error, setError] = useState<string | null>(null);
  const [progress, setProgress] = useState<"idle" | "uploading" | "saving">("idle");

  async function onPick(event: React.ChangeEvent<HTMLInputElement>) {
    const file = event.target.files?.[0];
    if (!file) return;
    setError(null);
    setProgress("uploading");
    try {
      const url = await uploadToCloudinary(file);
      setProgress("saving");
      startTransition(async () => {
        try {
          const fd = new FormData();
          fd.set("productId", productId);
          fd.set("url", url);
          fd.set("altText", file.name.replace(/\.[^.]+$/, ""));
          await addProductImageAction(fd);
          setProgress("idle");
          event.target.value = "";
        } catch (err) {
          setError(err instanceof Error ? err.message : "Gagal menyimpan gambar.");
          setProgress("idle");
        }
      });
    } catch (err) {
      setError(err instanceof Error ? err.message : "Upload gagal.");
      setProgress("idle");
    }
  }

  const label =
    progress === "uploading"
      ? "Mengunggah..."
      : progress === "saving" || pending
        ? "Menyimpan..."
        : "+ Upload gambar";

  return (
    <div className="rounded-lg border border-stone-200 bg-white p-4 shadow-sm">
      <label className="inline-flex cursor-pointer items-center gap-2 rounded-full bg-rose-900 px-4 py-2 text-sm font-semibold text-white hover:bg-rose-800">
        <input
          type="file"
          accept="image/*"
          onChange={onPick}
          disabled={progress !== "idle" || pending}
          className="hidden"
        />
        {label}
      </label>
      <p className="mt-2 text-xs text-stone-500">
        JPEG/PNG, max ~10MB. Folder Cloudinary: <code>njs-florist/products</code>.
      </p>
      {error ? <p className="mt-2 text-sm font-semibold text-rose-700">{error}</p> : null}
    </div>
  );
}
