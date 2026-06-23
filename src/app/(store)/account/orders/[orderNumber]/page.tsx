import { notFound, redirect } from "next/navigation";
import { formatIDR } from "@/lib/money";
import { db } from "@/lib/db";
import { env } from "@/lib/env";
import { snapScriptUrl } from "@/lib/midtrans";
import { SiteFooter } from "@/components/layout/site-footer";
import { SiteHeader } from "@/components/layout/site-header";
import { SnapButton } from "@/components/payment/snap-button";
import { StatusTimeline } from "@/components/order/status-timeline";
import { RefreshPaymentButton } from "@/components/order/refresh-payment-button";
import { Breadcrumb, PageKicker } from "@/components/ui/store-ui";
import {
  formatPickupDate,
  statusLabel,
  statusToneClass,
} from "@/lib/order-display";
import { slotLabel } from "@/server/services/slot-display.service";
import { getCurrentUser } from "@/lib/auth";

export const dynamic = "force-dynamic";

export default async function AccountOrderDetailPage({
  params,
}: {
  params: Promise<{ orderNumber: string }>;
}) {
  const { orderNumber } = await params;
  const user = await getCurrentUser();
  if (!user) redirect(`/sign-in?next=/account/orders/${orderNumber}`);

  const order = await db.order.findUnique({
    where: { orderNumber },
    include: {
      items: { include: { addons: true } },
      payments: { orderBy: { createdAt: "desc" } },
      statusHistory: { orderBy: { createdAt: "asc" } },
      store: true,
    },
  });
  if (!order) notFound();

  const slot = await slotLabel(order.deliverySlotId);
  const pendingPayment =
    order.status === "PENDING_PAYMENT"
      ? order.payments.find((p) => p.status === "PENDING" && p.providerToken && p.redirectUrl)
      : undefined;

  return (
    <>
      <SiteHeader />
      <main className="mx-auto max-w-4xl px-4 py-12 sm:px-6 lg:px-8">
        <Breadcrumb
          items={[
            { label: "Akun", href: "/account" },
            { label: "Pesanan", href: "/account/orders" },
            { label: order.orderNumber },
          ]}
        />
        <div className="mt-4">
          <PageKicker>Detail pesanan</PageKicker>
          <div className="mt-2 flex flex-wrap items-center gap-3">
            <h1 className="text-3xl font-bold tracking-tight text-black sm:text-4xl">
              {order.orderNumber}
            </h1>
            <span
              className={`inline-flex rounded-full px-2.5 py-1 text-xs font-medium ${statusToneClass(order.status)}`}
            >
              {statusLabel(order.status)}
            </span>
          </div>
        </div>

        {pendingPayment ? (
          <section className="mt-6 rounded-md border border-amber-300 bg-amber-50 p-5">
            <p className="text-sm font-semibold text-amber-900">
              Pembayaran belum diselesaikan
            </p>
            <p className="mt-1 text-sm text-amber-800">
              Selesaikan pembayaran agar pesanan diproses tim florist.
            </p>
            <div className="mt-4">
              <SnapButton
                token={pendingPayment.providerToken!}
                redirectUrl={pendingPayment.redirectUrl!}
                scriptUrl={snapScriptUrl()}
                clientKey={env.NEXT_PUBLIC_MIDTRANS_CLIENT_KEY ?? ""}
                orderNumber={order.orderNumber}
              />
            </div>
            <div className="mt-3 border-t border-amber-200 pt-3">
              <p className="text-xs text-amber-800">
                Sudah bayar tapi status belum berubah? Sinkronkan manual:
              </p>
              <div className="mt-2">
                <RefreshPaymentButton orderNumber={order.orderNumber} />
              </div>
            </div>
          </section>
        ) : null}

        <section className="mt-8 grid gap-6 md:grid-cols-2">
          <div className="rounded-md border border-stone-200 bg-white p-6">
            <h2 className="text-sm font-semibold uppercase tracking-[0.18em] text-black/60">
              Ringkasan
            </h2>
            <dl className="mt-4 grid gap-4 text-sm">
              <div>
                <dt className="text-black/55">Jadwal pickup</dt>
                <dd className="mt-1 font-semibold text-black">
                  {formatPickupDate(order.deliveryDate)}
                </dd>
                <dd className="text-xs text-black/65">{slot}</dd>
              </div>
              <div>
                <dt className="text-black/55">Toko pickup</dt>
                <dd className="mt-1 font-semibold text-black">{order.store.name}</dd>
                <dd className="text-xs text-black/65">{order.store.address}</dd>
              </div>
              <div>
                <dt className="text-black/55">Total</dt>
                <dd className="mt-1 font-semibold text-black">{formatIDR(order.total)}</dd>
              </div>
              <div>
                <dt className="text-black/55">Atas nama</dt>
                <dd className="mt-1 font-semibold text-black">
                  {order.recipientName} ({order.recipientPhone})
                </dd>
              </div>
            </dl>
          </div>

          <div className="rounded-md border border-stone-200 bg-white p-6">
            <h2 className="text-sm font-semibold uppercase tracking-[0.18em] text-black/60">
              Item
            </h2>
            <ul className="mt-4 space-y-3 text-sm">
              {order.items.map((item) => (
                <li key={item.id} className="border-b border-stone-100 pb-3 last:border-b-0">
                  <p className="font-semibold text-black">
                    {item.quantity}× {item.productName} — {item.variantName}
                  </p>
                  <p className="text-xs text-black/60">{formatIDR(item.totalPrice)}</p>
                  {item.addons.length > 0 ? (
                    <ul className="ml-4 mt-1 list-disc text-xs text-black/65">
                      {item.addons.map((addon) => (
                        <li key={addon.id}>
                          + {addon.addonName} × {addon.quantity}
                        </li>
                      ))}
                    </ul>
                  ) : null}
                </li>
              ))}
            </ul>
          </div>
        </section>

        <section className="mt-6 rounded-md border border-stone-200 bg-white p-6">
          <h2 className="text-sm font-semibold uppercase tracking-[0.18em] text-black/60">
            Riwayat status
          </h2>
          <div className="mt-4">
            <StatusTimeline
              history={order.statusHistory.map((row) => ({
                id: row.id,
                fromStatus: row.fromStatus,
                toStatus: row.toStatus,
                note: row.note,
                createdAt: row.createdAt,
              }))}
            />
          </div>
        </section>
      </main>
      <SiteFooter />
    </>
  );
}
