import { SiteFooter } from "@/components/layout/site-footer";
import { SiteHeader } from "@/components/layout/site-header";
import { SnapButton } from "@/components/payment/snap-button";
import { LinkButton, PageKicker, PageTitle } from "@/components/ui/store-ui";
import { formatIDR } from "@/lib/money";
import { snapScriptUrl } from "@/lib/midtrans";
import { statusLabel, statusToneClass } from "@/lib/order-display";
import { findOrderByNumber } from "@/server/services/order.service";

export const metadata = {
  title: "Pembayaran Pending",
};

export const dynamic = "force-dynamic";

export default async function PaymentPendingPage({
  searchParams,
}: {
  searchParams: Promise<{ order?: string }>;
}) {
  const { order: orderNumber } = await searchParams;
  const order = orderNumber ? await findOrderByNumber(orderNumber) : null;
  const payment = order?.payments?.[0];
  const clientKey = process.env.NEXT_PUBLIC_MIDTRANS_CLIENT_KEY;

  return (
    <>
      <SiteHeader />
      <main className="mx-auto max-w-3xl px-4 py-16 sm:px-6 lg:px-8">
        <PageKicker>Pembayaran</PageKicker>
        <PageTitle>Selesaikan pembayaran</PageTitle>
        {order ? (
          <div className="mt-6 rounded-md border border-stone-200 bg-white p-6">
            <p className="text-[11px] font-semibold uppercase tracking-[0.18em] text-black/55">
              Nomor pesanan
            </p>
            <p className="mt-1 text-xl font-semibold text-black">{order.orderNumber}</p>
            <dl className="mt-6 grid gap-3 text-sm">
              <div className="flex items-center justify-between">
                <dt className="text-black/55">Status</dt>
                <dd>
                  <span
                    className={`inline-flex rounded-full px-2.5 py-1 text-xs font-medium ${statusToneClass(order.status)}`}
                  >
                    {statusLabel(order.status)}
                  </span>
                </dd>
              </div>
              <div className="flex justify-between">
                <dt className="text-black/55">Total</dt>
                <dd className="font-semibold text-black">{formatIDR(order.total)}</dd>
              </div>
              <div className="flex justify-between">
                <dt className="text-black/55">Stok dikunci</dt>
                <dd className="text-black">15 menit</dd>
              </div>
            </dl>

            <div className="mt-6 border-t border-stone-200 pt-6">
              {payment && payment.providerToken && payment.redirectUrl && clientKey ? (
                <SnapButton
                  token={payment.providerToken}
                  redirectUrl={payment.redirectUrl}
                  scriptUrl={snapScriptUrl()}
                  clientKey={clientKey}
                  orderNumber={order.orderNumber}
                />
              ) : (
                <p className="text-sm text-black/70">
                  Tidak ada token pembayaran untuk pesanan ini. Hubungi admin kami via WhatsApp untuk bantuan.
                </p>
              )}
            </div>

            <p className="mt-6 text-xs text-black/55">
              Reservasi stok dilepas otomatis jika pembayaran tidak selesai dalam 15 menit.
            </p>
            <div className="mt-6 flex flex-wrap gap-3">
              <LinkButton href={`/account/orders/${order.orderNumber}`} variant="secondary" size="sm">
                Detail pesanan
              </LinkButton>
              <LinkButton href="/shop" variant="ghost" size="sm">
                Lanjut belanja
              </LinkButton>
            </div>
          </div>
        ) : (
          <p className="mt-4 text-stone-600">Pesanan tidak ditemukan.</p>
        )}
      </main>
      <SiteFooter />
    </>
  );
}
