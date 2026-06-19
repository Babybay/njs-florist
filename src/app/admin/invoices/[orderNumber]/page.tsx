import Link from "next/link";
import { notFound } from "next/navigation";
import { InvoicePrintButton } from "@/components/admin/invoice-print-button";
import { tagClass } from "@/components/admin/ui";
import { formatIDR, formatShortDate } from "@/lib/money";
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

const STATUS_LABEL: Record<InvoiceStatus, string> = {
  UNPAID: "Belum lunas",
  PAID: "Lunas",
  REFUNDED: "Refund",
  VOID: "Batal",
};

export default async function AdminInvoiceDetailPage({
  params,
}: {
  params: Promise<{ orderNumber: string }>;
}) {
  const { orderNumber } = await params;
  const invoice = await getInvoice(orderNumber);
  if (!invoice) notFound();

  const { order, settings, materials } = invoice;
  const pickupSlot = await slotLabel(order.deliverySlotId);
  const businessName = settings.business_name || "njs Florist";
  const businessPhone = settings.business_phone || "";
  const businessEmail = settings.business_email || "";
  const pickupAddress = settings.pickup_address || "";
  const latestPayments = order.payments.slice(0, 3);

  return (
    <div className="invoice-page mx-auto max-w-4xl">
      <div className="admin-print-hidden mb-5 flex flex-wrap items-center justify-between gap-3">
        <div>
          <Link href="/admin/invoices" className="text-sm font-medium text-stone-500 hover:text-stone-900">
            {"<-"} Kembali ke invoice
          </Link>
          <h1 className="mt-1 text-2xl font-semibold tracking-tight text-stone-900">
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

      <section className="invoice-document rounded-lg border border-stone-200/80 bg-white p-5 text-stone-900 shadow-sm sm:p-7">
        <header className="invoice-block grid gap-5 border-b border-stone-200 pb-4 sm:grid-cols-[1fr_260px]">
          <div>
            <div className="flex flex-wrap items-center gap-2">
              <p className="text-[11px] font-semibold uppercase tracking-[0.22em] text-stone-500">Invoice</p>
              <span className={tagClass(STATUS_TONE[invoice.status])}>{STATUS_LABEL[invoice.status]}</span>
            </div>
            <h2 className="mt-1 text-3xl font-semibold tracking-tight">{invoice.invoiceNumber}</h2>
            <p className="mt-1 text-sm text-stone-500">Order {order.orderNumber}</p>

            <dl className="mt-4 grid max-w-md grid-cols-2 gap-2 text-xs sm:grid-cols-3">
              <div className="rounded-md bg-stone-50 px-3 py-2">
                <dt className="text-stone-500">Dibuat</dt>
                <dd className="mt-0.5 font-semibold text-stone-900">
                  {formatShortDate(order.createdAt.toISOString())}
                </dd>
              </div>
              <div className="rounded-md bg-stone-50 px-3 py-2">
                <dt className="text-stone-500">Pickup</dt>
                <dd className="mt-0.5 font-semibold text-stone-900">
                  {formatShortDate(order.deliveryDate.toISOString())}
                </dd>
              </div>
              <div className="rounded-md bg-stone-50 px-3 py-2">
                <dt className="text-stone-500">Slot</dt>
                <dd className="mt-0.5 font-semibold text-stone-900">{pickupSlot}</dd>
              </div>
            </dl>
          </div>

          <div className="rounded-md border border-stone-200 bg-stone-50/70 p-3 text-left sm:text-right">
            <p className="font-semibold">{businessName}</p>
            <div className="mt-1 text-xs leading-5 text-stone-600">
              {businessEmail ? <p>{businessEmail}</p> : null}
              {businessPhone ? <p>{businessPhone}</p> : null}
              {pickupAddress ? <p className="mt-1">{pickupAddress}</p> : null}
            </div>
          </div>
        </header>

        <div className="invoice-block grid gap-3 border-b border-stone-200 py-4 md:grid-cols-3">
          <div>
            <p className="text-[11px] font-semibold uppercase tracking-wider text-stone-500">Tagihan untuk</p>
            <p className="mt-1 font-semibold">{order.recipientName}</p>
            <p className="text-xs text-stone-600">{order.recipientPhone}</p>
            {order.user?.email ? <p className="text-xs text-stone-600">{order.user.email}</p> : null}
          </div>
          <div>
            <p className="text-[11px] font-semibold uppercase tracking-wider text-stone-500">Pengirim</p>
            <p className="mt-1 font-semibold">{order.senderName}</p>
            <p className="text-xs text-stone-600">{order.isAnonymous ? "Anonim pada kartu" : "Nama ditampilkan"}</p>
          </div>
          <div className="rounded-md bg-stone-900 px-4 py-3 text-white">
            <p className="text-[11px] font-semibold uppercase tracking-wider text-white/60">Sisa tagihan</p>
            <p className="mt-1 text-2xl font-semibold tracking-tight">{formatIDR(invoice.balanceDue)}</p>
            <p className="mt-1 text-xs text-white/60">Total {formatIDR(order.total)}</p>
          </div>
        </div>

        <div className="invoice-block py-4">
          <table className="w-full text-left text-xs sm:text-sm">
            <thead className="border-b border-stone-200 text-[10px] uppercase tracking-wider text-stone-500">
              <tr>
                <th className="py-2 pr-4">Item</th>
                <th className="w-12 px-2 py-2 text-right">Qty</th>
                <th className="w-28 px-2 py-2 text-right">Harga</th>
                <th className="py-2 pl-4 text-right">Jumlah</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-stone-100">
              {order.items.map((item) => {
                const addonsTotal = item.addons.reduce((sum, addon) => sum + addon.totalPrice, 0);
                const lineTotal = item.totalPrice + addonsTotal;
                const photo = item.variant.product.images[0]?.url;
                const itemMaterials = item.variant.recipes.map((recipe) => ({
                  name: recipe.inventoryItem.name,
                  unit: recipe.inventoryItem.unit,
                  used: recipe.quantityNeeded * item.quantity,
                }));

                return (
                  <tr key={item.id}>
                    <td className="py-2.5 pr-4 align-top">
                      <div className="flex gap-3">
                        {photo ? (
                          // eslint-disable-next-line @next/next/no-img-element -- plain img prints reliably
                          <img
                            src={photo}
                            alt={item.productName}
                            className="h-14 w-14 shrink-0 rounded-md border border-stone-200 object-cover"
                          />
                        ) : (
                          <div className="flex h-14 w-14 shrink-0 items-center justify-center rounded-md border border-dashed border-stone-200 bg-stone-50 text-stone-300">
                            🌸
                          </div>
                        )}
                        <div className="min-w-0">
                          <p className="font-medium">{item.productName}</p>
                          <p className="text-xs text-stone-500">{item.variantName}</p>
                          {itemMaterials.length > 0 ? (
                            <div className="mt-1.5">
                              <p className="text-[10px] font-semibold uppercase tracking-wider text-stone-400">
                                Bahan dipakai
                              </p>
                              <ul className="mt-0.5 grid gap-0.5 text-[11px] text-stone-600">
                                {itemMaterials.map((mat) => (
                                  <li key={mat.name}>
                                    {mat.name} — {mat.used} {mat.unit}
                                  </li>
                                ))}
                              </ul>
                            </div>
                          ) : null}
                          {item.addons.length > 0 ? (
                            <ul className="mt-1 grid gap-0.5 text-[11px] text-stone-600">
                              {item.addons.map((addon) => (
                                <li key={addon.id}>
                                  + {addon.addonName} x {addon.quantity} ({formatIDR(addon.totalPrice)})
                                </li>
                              ))}
                            </ul>
                          ) : null}
                        </div>
                      </div>
                    </td>
                    <td className="px-2 py-2.5 text-right align-top">{item.quantity}</td>
                    <td className="px-2 py-2.5 text-right align-top">{formatIDR(item.unitPrice)}</td>
                    <td className="py-2.5 pl-4 text-right align-top font-medium">{formatIDR(lineTotal)}</td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>

        <div className="invoice-block grid gap-4 border-t border-stone-200 pt-4 md:grid-cols-[1fr_300px]">
          <div className="grid content-start gap-3 text-xs text-stone-600">
            {materials.length > 0 ? (
              <div className="rounded-md bg-stone-50 px-3 py-2">
                <p className="font-medium text-stone-900">Rekap bahan baku terpakai</p>
                <ul className="mt-1 grid gap-1 sm:grid-cols-2">
                  {materials.map((mat) => (
                    <li key={mat.name} className="flex justify-between gap-3">
                      <span>{mat.name}</span>
                      <span className="font-medium text-stone-900">
                        {mat.quantity} {mat.unit}
                      </span>
                    </li>
                  ))}
                </ul>
              </div>
            ) : null}
            {order.cardMessage ? (
              <div className="rounded-md bg-stone-50 px-3 py-2">
                <p className="font-medium text-stone-900">Pesan kartu</p>
                <p className="mt-1 italic">&quot;{order.cardMessage}&quot;</p>
              </div>
            ) : null}
            {order.deliveryNotes ? (
              <div className="rounded-md bg-stone-50 px-3 py-2">
                <p className="font-medium text-stone-900">Catatan pickup</p>
                <p className="mt-1">{order.deliveryNotes}</p>
              </div>
            ) : null}
            {latestPayments.length > 0 ? (
              <div className="rounded-md bg-stone-50 px-3 py-2">
                <p className="font-medium text-stone-900">Pembayaran</p>
                <ul className="mt-1 grid gap-1">
                  {latestPayments.map((payment) => (
                    <li key={payment.id} className="flex justify-between gap-3">
                      <span>
                        {payment.provider} - {payment.status}
                      </span>
                      <span className="font-medium text-stone-900">{formatIDR(payment.amount)}</span>
                    </li>
                  ))}
                </ul>
              </div>
            ) : null}
          </div>

          <dl className="grid gap-1.5 text-sm">
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
      </section>
    </div>
  );
}
