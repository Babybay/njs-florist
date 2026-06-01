import Link from "next/link";
import { notFound } from "next/navigation";
import { InvoicePrintButton } from "@/components/admin/invoice-print-button";
import { tagClass } from "@/components/admin/ui";
import { formatDateTime, formatIDR, formatShortDate } from "@/lib/money";
import { getInvoice, type InvoiceStatus } from "@/server/services/invoice.service";
import { slotLabel } from "@/server/services/slot-display.service";

export const metadata = {
  title: "Invoice",
};

export const dynamic = "force-dynamic";

const STATUS_TONE: Record<InvoiceStatus, Parameters<typeof tagClass>[0]> = {
  UNPAID: "amber",
  PAID: "emerald",
  REFUNDED: "sky",
  VOID: "neutral",
};

export default async function AdminInvoiceDetailPage({
  params,
}: {
  params: Promise<{ orderNumber: string }>;
}) {
  const { orderNumber } = await params;
  const invoice = await getInvoice(orderNumber);
  if (!invoice) notFound();

  const { order, settings } = invoice;
  const pickupSlot = await slotLabel(order.deliverySlotId);
  const businessName = settings.business_name || "njs Florist";
  const businessPhone = settings.business_phone || "";
  const businessEmail = settings.business_email || "";
  const pickupAddress = settings.pickup_address || "";

  return (
    <div className="invoice-page">
      <div className="admin-print-hidden mb-6 flex flex-wrap items-center justify-between gap-3">
        <div>
          <Link href="/admin/invoices" className="text-sm font-medium text-stone-500 hover:text-stone-900">
            {"<-"} Kembali ke invoice
          </Link>
          <h1 className="mt-2 text-3xl font-semibold tracking-tight text-stone-900">
            {invoice.invoiceNumber}
          </h1>
        </div>
        <div className="flex items-center gap-2">
          <Link
            href={`/admin/orders/${order.id}`}
            className="inline-flex items-center justify-center rounded-md border border-stone-200 bg-white px-3 py-1.5 text-sm font-medium text-stone-800 transition hover:bg-stone-100"
          >
            Buka pesanan
          </Link>
          <InvoicePrintButton />
        </div>
      </div>

      <section className="invoice-document rounded-lg border border-stone-200/80 bg-white p-6 text-stone-900 shadow-sm sm:p-8">
        <header className="flex flex-col gap-6 border-b border-stone-200 pb-6 sm:flex-row sm:items-start sm:justify-between">
          <div>
            <p className="text-xs font-semibold uppercase tracking-[0.22em] text-stone-500">Invoice</p>
            <h2 className="mt-2 text-3xl font-semibold tracking-tight">{invoice.invoiceNumber}</h2>
            <div className="mt-3 flex flex-wrap items-center gap-2">
              <span className={tagClass(STATUS_TONE[invoice.status])}>{invoice.status}</span>
              <span className="text-xs text-stone-500">Order {order.orderNumber}</span>
            </div>
          </div>
          <div className="text-left sm:text-right">
            <p className="text-lg font-semibold">{businessName}</p>
            {businessEmail ? <p className="text-sm text-stone-600">{businessEmail}</p> : null}
            {businessPhone ? <p className="text-sm text-stone-600">{businessPhone}</p> : null}
            {pickupAddress ? <p className="mt-2 max-w-xs text-sm text-stone-600 sm:ml-auto">{pickupAddress}</p> : null}
          </div>
        </header>

        <div className="grid gap-6 border-b border-stone-200 py-6 md:grid-cols-3">
          <div>
            <p className="text-xs font-semibold uppercase tracking-wider text-stone-500">Tagihan untuk</p>
            <p className="mt-2 font-semibold">{order.recipientName}</p>
            <p className="text-sm text-stone-600">{order.recipientPhone}</p>
            {order.user?.email ? <p className="text-sm text-stone-600">{order.user.email}</p> : null}
          </div>
          <div>
            <p className="text-xs font-semibold uppercase tracking-wider text-stone-500">Pengirim</p>
            <p className="mt-2 font-semibold">{order.senderName}</p>
            <p className="text-sm text-stone-600">{order.isAnonymous ? "Anonim pada kartu" : "Nama ditampilkan"}</p>
          </div>
          <div>
            <p className="text-xs font-semibold uppercase tracking-wider text-stone-500">Tanggal</p>
            <dl className="mt-2 grid gap-1 text-sm">
              <div className="flex justify-between gap-4">
                <dt className="text-stone-500">Dibuat</dt>
                <dd className="font-medium">{formatShortDate(order.createdAt.toISOString())}</dd>
              </div>
              <div className="flex justify-between gap-4">
                <dt className="text-stone-500">Pickup</dt>
                <dd className="font-medium">{formatShortDate(order.deliveryDate.toISOString())}</dd>
              </div>
              <div className="flex justify-between gap-4">
                <dt className="text-stone-500">Slot</dt>
                <dd className="font-medium">{pickupSlot}</dd>
              </div>
            </dl>
          </div>
        </div>

        <div className="overflow-x-auto py-6">
          <table className="w-full min-w-[640px] text-left text-sm">
            <thead className="border-b border-stone-200 text-xs uppercase tracking-wider text-stone-500">
              <tr>
                <th className="py-2 pr-4">Item</th>
                <th className="px-4 py-2 text-right">Qty</th>
                <th className="px-4 py-2 text-right">Harga</th>
                <th className="py-2 pl-4 text-right">Jumlah</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-stone-100">
              {order.items.map((item) => {
                const addonsTotal = item.addons.reduce((sum, addon) => sum + addon.totalPrice, 0);
                const lineTotal = item.totalPrice + addonsTotal;

                return (
                  <tr key={item.id}>
                    <td className="py-4 pr-4 align-top">
                      <p className="font-medium">{item.productName}</p>
                      <p className="text-xs text-stone-500">{item.variantName}</p>
                      {item.addons.length > 0 ? (
                        <ul className="mt-2 grid gap-1 text-xs text-stone-600">
                          {item.addons.map((addon) => (
                            <li key={addon.id}>
                              + {addon.addonName} x {addon.quantity} ({formatIDR(addon.totalPrice)})
                            </li>
                          ))}
                        </ul>
                      ) : null}
                    </td>
                    <td className="px-4 py-4 text-right align-top">{item.quantity}</td>
                    <td className="px-4 py-4 text-right align-top">{formatIDR(item.unitPrice)}</td>
                    <td className="py-4 pl-4 text-right align-top font-medium">{formatIDR(lineTotal)}</td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>

        <div className="grid gap-6 border-t border-stone-200 pt-6 md:grid-cols-[1fr_320px]">
          <div className="text-sm text-stone-600">
            {order.cardMessage ? (
              <div>
                <p className="font-medium text-stone-900">Pesan kartu</p>
                <p className="mt-1 italic">&quot;{order.cardMessage}&quot;</p>
              </div>
            ) : null}
            {order.deliveryNotes ? (
              <div className="mt-4">
                <p className="font-medium text-stone-900">Catatan pickup</p>
                <p className="mt-1">{order.deliveryNotes}</p>
              </div>
            ) : null}
          </div>

          <dl className="grid gap-2 text-sm">
            <div className="flex justify-between gap-4">
              <dt className="text-stone-500">Subtotal</dt>
              <dd>{formatIDR(order.subtotal)}</dd>
            </div>
            <div className="flex justify-between gap-4">
              <dt className="text-stone-500">Biaya layanan</dt>
              <dd>{formatIDR(order.deliveryFee)}</dd>
            </div>
            {order.discountAmount > 0 ? (
              <div className="flex justify-between gap-4">
                <dt className="text-stone-500">Diskon</dt>
                <dd>-{formatIDR(order.discountAmount)}</dd>
              </div>
            ) : null}
            <div className="flex justify-between gap-4 border-t border-stone-200 pt-2 text-base font-semibold">
              <dt>Total</dt>
              <dd>{formatIDR(order.total)}</dd>
            </div>
            <div className="flex justify-between gap-4">
              <dt className="text-stone-500">Terbayar</dt>
              <dd>{formatIDR(invoice.paidAmount)}</dd>
            </div>
            <div className="flex justify-between gap-4 rounded-md bg-stone-100 px-3 py-2 text-base font-semibold">
              <dt>Sisa tagihan</dt>
              <dd>{formatIDR(invoice.balanceDue)}</dd>
            </div>
          </dl>
        </div>

        {order.payments.length > 0 ? (
          <div className="mt-8 border-t border-stone-200 pt-5">
            <p className="text-xs font-semibold uppercase tracking-wider text-stone-500">Riwayat pembayaran</p>
            <ul className="mt-3 grid gap-2 text-xs text-stone-600">
              {order.payments.map((payment) => (
                <li key={payment.id} className="flex flex-wrap justify-between gap-2 rounded-md bg-stone-50 px-3 py-2">
                  <span>
                    {payment.provider} - {payment.status} - {formatDateTime(payment.createdAt)}
                  </span>
                  <span className="font-medium text-stone-900">{formatIDR(payment.amount)}</span>
                </li>
              ))}
            </ul>
          </div>
        ) : null}
      </section>
    </div>
  );
}
