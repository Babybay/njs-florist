import Link from "next/link";
import { AdminPageHeader } from "@/components/admin/admin-shell";
import { OrderStatusBadge } from "@/components/admin/order-status-badge";
import { Button, CardSection, EmptyState, inputClass } from "@/components/admin/ui";
import { formatIDR, formatShortDate } from "@/lib/money";
import { listOrders } from "@/server/services/order.service";
import { listStores } from "@/server/services/store.service";
import type { OrderStatus } from "@/types/order";

export const metadata = {
  title: "Admin Pesanan",
};

export const dynamic = "force-dynamic";

const ALL_STATUSES: OrderStatus[] = [
  "PENDING_PAYMENT",
  "PAID",
  "PREPARING",
  "READY_FOR_DELIVERY",
  "OUT_FOR_DELIVERY",
  "DELIVERED",
  "COMPLETED",
  "CANCELLED",
  "EXPIRED",
  "REFUNDED",
  "PAYMENT_FAILED",
];

export default async function AdminOrdersPage({
  searchParams,
}: {
  searchParams: Promise<{
    status?: string;
    q?: string;
    from?: string;
    to?: string;
    store?: string;
  }>;
}) {
  const sp = await searchParams;
  const selectedStatuses = sp.status
    ? (sp.status.split(",").filter((s) => ALL_STATUSES.includes(s as OrderStatus)) as OrderStatus[])
    : [];

  const stores = await listStores();
  const orders = await listOrders({
    statuses: selectedStatuses.length ? selectedStatuses : undefined,
    q: sp.q?.trim() || undefined,
    fromDate: sp.from ? new Date(sp.from) : undefined,
    toDate: sp.to ? new Date(`${sp.to}T23:59:59`) : undefined,
    storeId: sp.store || undefined,
  });

  const hasFilters = sp.status || sp.q || sp.from || sp.to || sp.store;

  return (
    <>
      <AdminPageHeader
        title="Pesanan"
        icon="🧾"
        description="Cari berdasarkan nomor pesanan / pengambil, atau filter status dan rentang tanggal."
      />

      <form
        method="get"
        className="mb-4 rounded-lg border border-stone-200/80 bg-white p-4"
      >
        <div className="grid gap-2 md:grid-cols-[1.4fr_0.9fr_0.9fr_0.9fr_auto]">
          <input
            name="q"
            defaultValue={sp.q ?? ""}
            placeholder="Cari nomor pesanan, nama, atau no HP..."
            className={inputClass()}
          />
          <select name="store" defaultValue={sp.store ?? ""} className={inputClass()}>
            <option value="">Semua toko</option>
            {stores.map((s) => (
              <option key={s.id} value={s.id}>{s.name}</option>
            ))}
          </select>
          <input
            name="from"
            type="date"
            defaultValue={sp.from ?? ""}
            className={inputClass()}
          />
          <input
            name="to"
            type="date"
            defaultValue={sp.to ?? ""}
            className={inputClass()}
          />
          <Button type="submit" variant="primary">Filter</Button>
        </div>

        <div className="mt-3 flex flex-wrap gap-1.5">
          {ALL_STATUSES.map((s) => {
            const checked = selectedStatuses.includes(s);
            return (
              <label
                key={s}
                className={`cursor-pointer rounded-md border px-2.5 py-1 text-xs font-medium transition ${
                  checked
                    ? "border-stone-900 bg-stone-900 text-white"
                    : "border-stone-200 bg-white text-stone-600 hover:bg-stone-100"
                }`}
              >
                <input type="checkbox" name="status" value={s} defaultChecked={checked} className="hidden" />
                {s}
              </label>
            );
          })}
          {hasFilters ? (
            <Link
              href="/admin/orders"
              className="ml-auto text-xs font-medium text-stone-500 hover:text-stone-900"
            >
              ✕ Reset
            </Link>
          ) : null}
        </div>
      </form>

      {orders.length === 0 ? (
        <EmptyState
          icon="🧾"
          title="Tidak ada pesanan"
          description={hasFilters ? "Coba ubah filter atau reset." : "Pesanan baru akan muncul di sini."}
        />
      ) : (
        <div className="overflow-hidden rounded-lg border border-stone-200/80 bg-white">
          <ul className="divide-y divide-stone-100">
            {orders.map((order) => (
              <li key={order.id}>
                <Link
                  href={`/admin/orders/${order.id}`}
                  className="flex flex-col gap-2 px-4 py-3 transition hover:bg-stone-50/70 lg:flex-row lg:items-center lg:justify-between"
                >
                  <div className="min-w-0 flex-1">
                    <div className="flex flex-wrap items-center gap-2">
                      <p className="font-medium text-stone-900">{order.orderNumber}</p>
                      <OrderStatusBadge status={order.status} />
                      <span className="rounded bg-stone-100 px-2 py-0.5 text-xs font-medium text-stone-600">
                        {order.store?.name ?? "—"}
                      </span>
                    </div>
                    <p className="mt-0.5 truncate text-sm text-stone-600">
                      {order.items.map((item) => `${item.productName} · ${item.variantName}`).join(", ")}
                    </p>
                    <p className="mt-0.5 text-xs text-stone-500">
                      {order.recipientName} · pickup {formatShortDate(order.deliveryDate.toISOString())} · slot {order.deliverySlotId}
                    </p>
                  </div>
                  <span className="shrink-0 text-sm font-medium text-stone-900">{formatIDR(order.total)}</span>
                </Link>
              </li>
            ))}
          </ul>
        </div>
      )}
    </>
  );
}
