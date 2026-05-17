"use client";

import { useEffect } from "react";

export default function AdminRouteError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    console.error("Admin route error:", error);
  }, [error]);

  return (
    <div className="rounded-lg border border-rose-200 bg-rose-50 p-6">
      <p className="text-sm font-semibold text-rose-900">Halaman admin gagal dimuat.</p>
      <p className="mt-1 text-sm text-rose-800">{error.message}</p>
      {error.digest ? (
        <p className="mt-2 font-mono text-xs text-rose-700">ref: {error.digest}</p>
      ) : null}
      <button
        type="button"
        onClick={reset}
        className="mt-4 rounded-full bg-rose-900 px-4 py-2 text-xs font-semibold text-white hover:bg-rose-800"
      >
        Coba lagi
      </button>
    </div>
  );
}
