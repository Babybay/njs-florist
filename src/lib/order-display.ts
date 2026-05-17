const STATUS_LABEL: Record<string, string> = {
  PENDING_PAYMENT: "Menunggu pembayaran",
  PAID: "Terbayar",
  PREPARING: "Sedang disiapkan",
  READY_FOR_DELIVERY: "Siap diambil",
  OUT_FOR_DELIVERY: "Sedang diambil",
  DELIVERED: "Sudah diambil",
  COMPLETED: "Selesai",
  CANCELLED: "Dibatalkan",
  EXPIRED: "Kedaluwarsa",
  REFUNDED: "Dana dikembalikan",
  PAYMENT_FAILED: "Pembayaran gagal",
  DRAFT: "Draft",
};

type Tone = "neutral" | "amber" | "emerald" | "sky" | "violet" | "rose";

const STATUS_TONE: Record<string, Tone> = {
  PENDING_PAYMENT: "amber",
  PAID: "emerald",
  PREPARING: "amber",
  READY_FOR_DELIVERY: "sky",
  OUT_FOR_DELIVERY: "violet",
  DELIVERED: "emerald",
  COMPLETED: "neutral",
  CANCELLED: "rose",
  EXPIRED: "neutral",
  REFUNDED: "rose",
  PAYMENT_FAILED: "rose",
  DRAFT: "neutral",
};

const TONE_CLASS: Record<Tone, string> = {
  neutral: "bg-stone-100 text-stone-700",
  amber: "bg-amber-50 text-amber-800",
  emerald: "bg-emerald-50 text-emerald-700",
  sky: "bg-sky-50 text-sky-700",
  violet: "bg-violet-50 text-violet-700",
  rose: "bg-rose-50 text-rose-700",
};

export function statusLabel(status: string): string {
  return STATUS_LABEL[status] ?? status;
}

export function statusToneClass(status: string): string {
  return TONE_CLASS[STATUS_TONE[status] ?? "neutral"];
}

export function formatPickupDate(date: Date): string {
  return new Intl.DateTimeFormat("id-ID", {
    weekday: "long",
    day: "numeric",
    month: "long",
    year: "numeric",
  }).format(date);
}
