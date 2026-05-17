import { statusLabel, statusToneClass } from "@/lib/order-display";

export function OrderStatusBadge({ status }: { status: string }) {
  return (
    <span
      className={`inline-flex items-center rounded-full px-2 py-0.5 text-[11px] font-medium ${statusToneClass(status)}`}
    >
      {statusLabel(status)}
    </span>
  );
}
