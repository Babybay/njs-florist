"use client";

import Link from "next/link";
import { useEffect } from "react";

export default function GlobalRouteError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    console.error("Route error:", error);
  }, [error]);

  return (
    <main className="mx-auto max-w-2xl px-4 py-20 text-center sm:px-6">
      <p className="text-[11px] font-semibold uppercase tracking-[0.28em] text-black/55">
        Ada kendala
      </p>
      <h1 className="mt-3 text-3xl font-bold tracking-tight text-black sm:text-4xl">
        Halaman ini gagal dimuat
      </h1>
      <p className="mt-4 text-stone-600">
        Coba muat ulang sebentar. Kalau terus terjadi, hubungi admin dengan menyebut kode di bawah.
      </p>
      {error.digest ? (
        <p className="mt-2 font-mono text-xs text-black/50">ref: {error.digest}</p>
      ) : null}
      <div className="mt-8 flex justify-center gap-3">
        <button
          type="button"
          onClick={reset}
          className="inline-flex items-center bg-black px-6 py-3 text-sm font-semibold uppercase tracking-[0.16em] text-white transition hover:bg-[color:var(--blush-strong)] hover:text-black"
        >
          Coba lagi
        </button>
        <Link
          href="/"
          className="inline-flex items-center border border-black px-6 py-3 text-sm font-semibold uppercase tracking-[0.16em] text-black transition hover:bg-black hover:text-white"
        >
          Kembali ke beranda
        </Link>
      </div>
    </main>
  );
}
