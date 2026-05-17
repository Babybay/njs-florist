import { SiteFooter } from "@/components/layout/site-footer";
import { SiteHeader } from "@/components/layout/site-header";
import { LinkButton, PageKicker, PageTitle } from "@/components/ui/store-ui";
import { formatIDR } from "@/lib/money";
import { statusLabel, statusToneClass } from "@/lib/order-display";
import { findOrderByNumber } from "@/server/services/order.service";

export const metadata = {
  title: "Pembayaran Berhasil",
};

export const dynamic = "force-dynamic";

export default async function PaymentSuccessPage({
  searchParams,
}: {
  searchParams: Promise<{ order?: string }>;
}) {
  const { order: orderNumber } = await searchParams;
  const order = orderNumber ? await findOrderByNumber(orderNumber) : null;

  return (
    <>
      <SiteHeader />
      <main className="mx-auto max-w-3xl px-4 py-16 sm:px-6 lg:px-8">
        <PageKicker>Pembayaran</PageKicker>
        <PageTitle>Pembayaran diterima</PageTitle>
        <p className="mt-4 text-stone-600">
          Terima kasih! Tim florist akan menyiapkan pesananmu dan mengabari lewat WhatsApp saat siap diambil.
        </p>
        {order ? (
          <div className="mt-8 rounded-md border border-stone-200 bg-white p-6">
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
            </dl>
          </div>
        ) : null}
        <div className="mt-8 flex flex-wrap gap-3">
          <LinkButton href="/account/orders">Lihat riwayat pesanan</LinkButton>
          <LinkButton href="/shop" variant="secondary">Lanjut belanja</LinkButton>
        </div>
      </main>
      <SiteFooter />
    </>
  );
}
