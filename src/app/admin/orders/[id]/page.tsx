import Link from "next/link";
import { notFound } from "next/navigation";
import { db } from "@/lib/db";
import { AdminPageHeader } from "@/components/admin/admin-shell";
import { OrderStatusBadge } from "@/components/admin/order-status-badge";
import { OrderStatusControls } from "@/components/admin/order-status-controls";
import { CardSection, tagClass } from "@/components/admin/ui";
import { StatusTimeline } from "@/components/order/status-timeline";
import { RefreshPaymentButton } from "@/components/order/refresh-payment-button";
import { formatDateTime, formatIDR, formatShortDate } from "@/lib/money";
import type { OrderStatus } from "@/types/order";

export const dynamic = "force-dynamic";

export default async function AdminOrderDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const order = await db.order.findFirst({
    where: { OR: [{ id }, { orderNumber: id }] },
    include: {
      items: { include: { addons: true } },
      payments: { orderBy: { createdAt: "desc" } },
      reservations: { include: { inventoryItem: true } },
      statusHistory: { orderBy: { createdAt: "asc" } },
      user: { select: { id: true, email: true, name: true } },
    },
  });
  if (!order) notFound();

  return (
    <>
      <AdminPageHeader
        title={order.orderNumber}
        icon="🧾"
        description="Detail pesanan lengkap dengan riwayat status dan kontrol admin."
      />

      <div className="mb-6 flex flex-wrap items-center gap-2 text-sm">
        <OrderStatusBadge status={order.status} />
        <span className="text-stone-500">
          Dibuat {formatDateTime(order.createdAt)}
        </span>
        <span className="text-stone-300">·</span>
        {order.user ? (
          <Link
            href={`/admin/users#${order.user.id}`}
            className="font-medium text-stone-700 hover:underline"
          >
            {order.user.name ?? order.user.email}
          </Link>
        ) : (
          <span className="text-stone-500">Guest checkout</span>
        )}
      </div>

      <div className="grid gap-4 lg:grid-cols-[1.4fr_1fr]">
        <div className="grid gap-4">
          <CardSection title="Item">
            <ul className="grid gap-2 text-sm">
              {order.items.map((item) => (
                <li key={item.id} className="rounded-md border border-stone-200 bg-stone-50/40 p-3">
                  <p className="font-medium text-stone-900">
                    {item.quantity}× {item.productName} <span className="text-stone-500">— {item.variantName}</span>
                  </p>
                  <p className="mt-0.5 text-xs text-stone-600">
                    {item.quantity} × {formatIDR(item.unitPrice)} = {formatIDR(item.totalPrice)}
                  </p>
                  {item.addons.length > 0 ? (
                    <ul className="mt-1.5 ml-4 list-disc text-xs text-stone-600">
                      {item.addons.map((addon) => (
                        <li key={addon.id}>
                          + {addon.addonName} × {addon.quantity} ({formatIDR(addon.totalPrice)})
                        </li>
                      ))}
                    </ul>
                  ) : null}
                </li>
              ))}
            </ul>
            <div className="mt-4 grid gap-1.5 border-t border-stone-200/80 pt-3 text-sm text-stone-700">
              <div className="flex justify-between"><span className="text-stone-500">Subtotal</span><span>{formatIDR(order.subtotal)}</span></div>
              {order.deliveryFee > 0 ? (
                <div className="flex justify-between"><span className="text-stone-500">Biaya layanan</span><span>{formatIDR(order.deliveryFee)}</span></div>
              ) : null}
              {order.discountAmount > 0 ? (
                <div className="flex justify-between"><span className="text-stone-500">Diskon</span><span>-{formatIDR(order.discountAmount)}</span></div>
              ) : null}
              <div className="flex justify-between border-t border-stone-200/80 pt-2 text-base font-semibold text-stone-900">
                <span>Total</span><span>{formatIDR(order.total)}</span>
              </div>
            </div>
          </CardSection>

          <CardSection title="Riwayat status">
            <StatusTimeline
              history={order.statusHistory.map((row) => ({
                id: row.id,
                fromStatus: row.fromStatus,
                toStatus: row.toStatus,
                note: row.note,
                createdAt: row.createdAt,
              }))}
            />
          </CardSection>

          {order.payments.length > 0 ? (
            <CardSection title="Pembayaran">
              <ul className="grid gap-2 text-sm">
                {order.payments.map((payment) => (
                  <li key={payment.id} className="rounded-md border border-stone-200 bg-stone-50/40 p-3">
                    <div className="flex flex-wrap items-center gap-2">
                      <span className="font-medium text-stone-900">{payment.provider}</span>
                      <span className={tagClass(payment.status === "PAID" ? "emerald" : payment.status === "FAILED" ? "rose" : "amber")}>
                        {payment.status}
                      </span>
                      <span className="ml-auto text-sm font-medium text-stone-900">{formatIDR(payment.amount)}</span>
                    </div>
                    <p className="mt-1 font-mono text-xs text-stone-500">{payment.providerOrderId}</p>
                    <p className="mt-1 text-xs text-stone-500">
                      Dibuat {formatDateTime(payment.createdAt)}
                      {payment.paidAt ? ` · Lunas ${formatDateTime(payment.paidAt)}` : ""}
                    </p>
                  </li>
                ))}
              </ul>
            </CardSection>
          ) : null}
        </div>

        <div className="grid gap-4">
          <CardSection title="Kontrol admin">
            <OrderStatusControls
              orderId={order.id}
              status={order.status as OrderStatus}
            />
          </CardSection>

          <CardSection title="Sinkronisasi Midtrans" description="Tarik status terbaru langsung dari API Midtrans (fallback kalau webhook tidak masuk).">
            <RefreshPaymentButton orderNumber={order.orderNumber} />
          </CardSection>

          <CardSection title="Pickup">
            <dl className="grid gap-2.5 text-sm">
              <div>
                <dt className="text-xs text-stone-500">Pengambil</dt>
                <dd className="mt-0.5 font-medium text-stone-900">
                  {order.recipientName} <span className="text-stone-500">({order.recipientPhone})</span>
                </dd>
              </div>
              <div>
                <dt className="text-xs text-stone-500">Jadwal pickup</dt>
                <dd className="mt-0.5 font-medium text-stone-900">
                  {formatShortDate(order.deliveryDate.toISOString())} · slot {order.deliverySlotId}
                </dd>
              </div>
              {order.deliveryNotes ? (
                <div>
                  <dt className="text-xs text-stone-500">Catatan staff</dt>
                  <dd className="mt-0.5 text-stone-700">{order.deliveryNotes}</dd>
                </div>
              ) : null}
              {order.cardMessage ? (
                <div>
                  <dt className="text-xs text-stone-500">Pesan kartu</dt>
                  <dd className="mt-0.5 italic text-stone-700">&ldquo;{order.cardMessage}&rdquo;</dd>
                </div>
              ) : null}
            </dl>
          </CardSection>

          {order.reservations.length > 0 ? (
            <CardSection title="Reservasi stok">
              <ul className="grid gap-1.5 text-xs">
                {order.reservations.map((r) => (
                  <li key={r.id} className="flex items-center justify-between rounded-md border border-stone-200 bg-stone-50/40 px-2.5 py-2">
                    <span className="text-stone-800">
                      {r.inventoryItem.name} × {r.quantity} {r.inventoryItem.unit}
                    </span>
                    <span className={tagClass(r.status === "ACTIVE" ? "amber" : r.status === "COMMITTED" ? "emerald" : "neutral")}>
                      {r.status}
                    </span>
                  </li>
                ))}
              </ul>
            </CardSection>
          ) : null}
        </div>
      </div>
    </>
  );
}
