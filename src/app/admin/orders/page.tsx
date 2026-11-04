import Link from "next/link";
import { AdminPageHeader } from "@/components/admin/admin-shell";
import { OrderStatusBadge } from "@/components/admin/order-status-badge";
import { Button, CardSection, EmptyState, inputClass } from "@/components/admin/ui";
import { formatIDR, formatShortDate } from "@/lib/money";
import { listOrders } from "@/server/services/order.service";
import { listStores } from "@/server/services/store.service";
import { slotLabelsFor } from "@/server/services/slot-display.service";
import { statusLabel } from "@/lib/order-display";
import type { OrderStatus } from "@/types/order";
import { ADMIN_ORDER_STATUSES, parseAdminOrderFilters, type AdminOrderParams } from "@/lib/admin-order-filters";

export const metadata = {
  title: "Admin Pesanan",
};

export const dynamic = "force-dynamic";

const ALL_STATUSES = ADMIN_ORDER_STATUSES;

export default async function AdminOrdersPage({
  searchParams,
}: {
  searchParams: Promise<AdminOrderParams>;
}) {
  const sp = await searchParams;
  const { statuses: selectedStatuses, filters, errors } = parseAdminOrderFilters(sp);

  const stores = await listStores();
  const orders = errors.length ? [] : await listOrders(filters);

  const slotLabels = await slotLabelsFor(orders.map((o) => o.deliverySlotId));
  const hasFilters = sp.status || sp.q || sp.from || sp.to || sp.store || sp.pickup;

  return (
    <>
      <AdminPageHeader
        title="Pesanan"
        icon="🧾"
        description="Cari pesanan, filter tanggal masuk atau jadwal pickup. Semua tanggal mengikuti WITA."
      />

      <form
        method="get"
        className="mb-4 rounded-lg border border-stone-200/80 bg-white p-4"
      >
        <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-3">
          <label className="grid gap-1.5 text-sm">Cari pesanan
          <input
            name="q"
            maxLength={200}
            defaultValue={sp.q ?? ""}
            placeholder="Cari nomor pesanan, nama, atau no HP..."
            className={inputClass()}
          /></label>
          <label className="grid gap-1.5 text-sm">Toko pickup<select name="store" defaultValue={sp.store ?? ""} className={inputClass()}>
            <option value="">Semua toko</option>
            {stores.map((s) => (
              <option key={s.id} value={s.id}>{s.name}</option>
            ))}
          </select></label>
          <label className="grid gap-1.5 text-sm">Tanggal pickup<input type="date" name="pickup" defaultValue={sp.pickup ?? ""} className={inputClass()} /></label>
          <label className="grid gap-1.5 text-sm">Pesanan masuk mulai
          <input
            name="from"
            type="date"
            defaultValue={sp.from ?? ""}
            className={inputClass()}
          /></label>
          <label className="grid gap-1.5 text-sm">Pesanan masuk sampai
          <input
            name="to"
            type="date"
            defaultValue={sp.to ?? ""}
            className={inputClass()}
          /></label>
          <Button type="submit" variant="primary" className="self-end">Terapkan filter</Button>
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
                <input type="checkbox" name="status" value={s} defaultChecked={checked} className="mr-2 h-4 w-4 accent-rose-800" />
                {statusLabel(s)}
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
      {errors.length ? <p role="alert" className="mb-4 text-sm text-rose-800">{errors.join(" ")}</p> : null}
      {orders.length >= 100 ? <p role="status" className="mb-4 text-sm text-stone-600">Menampilkan 100 pesanan terbaru. Persempit tanggal, toko, atau pencarian untuk melihat pesanan lainnya.</p> : null}

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
                      {order.recipientName} · pickup {formatShortDate(order.deliveryDate.toISOString())} · {slotLabels.get(order.deliverySlotId) ?? "slot —"}
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
