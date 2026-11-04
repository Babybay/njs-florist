import { isPickupDateKey, pickupDayBounds } from "@/lib/pickup-schedule";
import type { OrderStatus } from "@/types/order";

export const ADMIN_ORDER_STATUSES: OrderStatus[] = ["PENDING_PAYMENT", "PAID", "PREPARING", "READY_FOR_DELIVERY", "OUT_FOR_DELIVERY", "DELIVERED", "COMPLETED", "CANCELLED", "EXPIRED", "REFUNDED", "PAYMENT_FAILED"];
export type AdminOrderParams = { status?: string | string[]; q?: string; from?: string; to?: string; store?: string; pickup?: string };

export function parseAdminOrderFilters(params: AdminOrderParams) {
  const raw = Array.isArray(params.status) ? params.status : [params.status ?? ""];
  const statuses = [...new Set(raw.flatMap((value) => value.split(",")))].filter((value): value is OrderStatus => ADMIN_ORDER_STATUSES.includes(value as OrderStatus));
  const errors: string[] = [];
  const validDate = (value: string | undefined, label: string) => {
    if (!value) return undefined;
    if (isPickupDateKey(value)) return value;
    errors.push(`${label} tidak valid.`); return undefined;
  };
  let from = validDate(params.from, "Tanggal awal");
  let to = validDate(params.to, "Tanggal akhir");
  const pickup = validDate(params.pickup, "Tanggal pickup");
  if (from && to && from > to) { errors.push("Tanggal akhir harus sama atau setelah tanggal awal."); from = undefined; to = undefined; }
  return { statuses, errors, filters: {
    statuses: statuses.length ? statuses : undefined,
    q: params.q?.trim().slice(0, 200) || undefined,
    storeId: params.store || undefined,
    fromDate: from ? pickupDayBounds(from).start : undefined,
    toDate: to ? new Date(pickupDayBounds(to).end.getTime() - 1) : undefined,
    pickupDate: pickup,
    limit: 100,
  } };
}
