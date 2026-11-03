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
    <main id="main-content" className="store-error store-container">
      <h1>
        Halaman ini gagal dimuat
      </h1>
      <p>
        Coba muat ulang sebentar. Kalau terus terjadi, hubungi admin dengan menyebut kode di bawah.
      </p>
      {error.digest ? (
        <p className="mt-2 font-mono text-xs text-black/50">ref: {error.digest}</p>
      ) : null}
      <div className="store-hero-actions">
        <button
          type="button"
          onClick={reset}
          className="nf-btn nf-btn--primary"
        >
          Coba lagi
        </button>
        <Link
          href="/"
          className="nf-btn nf-btn--secondary"
        >
          Kembali ke beranda
        </Link>
      </div>
    </main>
  );
}
