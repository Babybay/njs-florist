"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";

type SnapResult = {
  status_code?: string;
  transaction_status?: string;
};

declare global {
  interface Window {
    snap?: {
      pay: (
        token: string,
        callbacks?: {
          onSuccess?: (result: SnapResult) => void;
          onPending?: (result: SnapResult) => void;
          onError?: (result: SnapResult) => void;
          onClose?: () => void;
        },
      ) => void;
    };
  }
}

export function SnapButton({
  token,
  redirectUrl,
  scriptUrl,
  clientKey,
  orderNumber,
}: {
  token: string;
  redirectUrl: string;
  scriptUrl: string;
  clientKey: string;
  orderNumber: string;
}) {
  const router = useRouter();
  const [ready, setReady] = useState(false);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (typeof window === "undefined") return;
    if (window.snap) {
      setReady(true);
      return;
    }
    const existing = document.querySelector<HTMLScriptElement>(
      `script[src="${scriptUrl}"]`,
    );
    if (existing) {
      existing.addEventListener("load", () => setReady(true), { once: true });
      return;
    }
    const script = document.createElement("script");
    script.src = scriptUrl;
    script.setAttribute("data-client-key", clientKey);
    script.async = true;
    script.onload = () => setReady(true);
    script.onerror = () => setError("Gagal memuat Snap.js — coba refresh.");
    document.body.appendChild(script);
  }, [scriptUrl, clientKey]);

  function pay() {
    setError(null);
    if (!ready || !window.snap) {
      window.location.href = redirectUrl;
      return;
    }
    setBusy(true);
    window.snap.pay(token, {
      onSuccess: () => {
        router.push(`/payment/success?order=${encodeURIComponent(orderNumber)}`);
      },
      onPending: () => {
        router.refresh();
      },
      onError: (result) => {
        setBusy(false);
        setError(`Pembayaran gagal: ${result.status_code ?? "unknown"}.`);
      },
      onClose: () => {
        setBusy(false);
      },
    });
  }

  return (
    <div className="grid gap-3">
      <button
        type="button"
        onClick={pay}
        disabled={busy}
        className="inline-flex items-center justify-center bg-black px-6 py-3 text-sm font-semibold uppercase tracking-[0.16em] text-white transition hover:bg-[color:var(--blush-strong)] hover:text-black disabled:cursor-not-allowed disabled:opacity-60"
      >
        {busy ? "Membuka Snap…" : ready ? "Bayar sekarang" : "Memuat Snap…"}
      </button>
      <a
        href={redirectUrl}
        target="_blank"
        rel="noopener noreferrer"
        className="text-xs font-semibold text-black/60 underline-offset-4 hover:text-black hover:underline"
      >
        Buka halaman pembayaran Midtrans di tab baru
      </a>
      {error ? <p className="text-sm font-semibold text-rose-700">{error}</p> : null}
    </div>
  );
}
