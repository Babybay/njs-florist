import { formatShortDate } from "@/lib/money";
import type { OrderStatus } from "@/types/order";

type HistoryRow = {
  id: string;
  fromStatus: OrderStatus | null;
  toStatus: OrderStatus;
  note: string | null;
  createdAt: Date;
};

const LABEL: Record<OrderStatus, string> = {
  DRAFT: "Draft",
  PENDING_PAYMENT: "Menunggu pembayaran",
  PAID: "Pembayaran diterima",
  PREPARING: "Sedang disiapkan",
  READY_FOR_DELIVERY: "Siap diambil",
  OUT_FOR_DELIVERY: "Sedang diambil",
  DELIVERED: "Sudah diambil",
  COMPLETED: "Selesai",
  PAYMENT_FAILED: "Pembayaran gagal",
  EXPIRED: "Kedaluwarsa",
  CANCELLED: "Dibatalkan",
  REFUNDED: "Dikembalikan",
};

function formatDateTime(d: Date) {
  return `${formatShortDate(d.toISOString())} ${d.toLocaleTimeString("id-ID", {
    hour: "2-digit",
    minute: "2-digit",
  })}`;
}

export function StatusTimeline({ history }: { history: HistoryRow[] }) {
  if (history.length === 0) {
    return (
      <p className="text-sm text-stone-500">Belum ada riwayat status.</p>
    );
  }

  return (
    <ol className="relative ml-4 border-l border-stone-200">
      {history.map((row, idx) => {
        const isLast = idx === history.length - 1;
        return (
          <li key={row.id} className="mb-6 ml-4">
            <span
              className={`absolute -left-2 mt-1.5 h-4 w-4 rounded-full border-2 border-white ${
                isLast ? "bg-black" : "bg-stone-300"
              }`}
            />
            <p className="font-semibold text-black">{LABEL[row.toStatus]}</p>
            <p className="text-xs text-black/55">{formatDateTime(row.createdAt)}</p>
            {row.note ? <p className="mt-1 text-sm text-black/70">{row.note}</p> : null}
          </li>
        );
      })}
    </ol>
  );
}
