import Link from "next/link";
import { AdminPageHeader } from "@/components/admin/admin-shell";
import { EmptyState, inputClass, tagClass } from "@/components/admin/ui";
import { formatIDR, formatShortDate } from "@/lib/money";
import { listInvoices, type InvoiceStatus } from "@/server/services/invoice.service";

export const metadata = {
  title: "Admin Invoice",
};

export const dynamic = "force-dynamic";

const STATUSES: InvoiceStatus[] = ["UNPAID", "PAID", "REFUNDED", "VOID"];

const STATUS_TONE: Record<InvoiceStatus, Parameters<typeof tagClass>[0]> = {
  UNPAID: "amber",
  PAID: "emerald",
  REFUNDED: "sky",
  VOID: "neutral",
};

export default async function AdminInvoicesPage({
  searchParams,
}: {
  searchParams: Promise<{ status?: string; q?: string }>;
}) {
  const sp = await searchParams;
  const status = STATUSES.includes(sp.status as InvoiceStatus)
    ? (sp.status as InvoiceStatus)
    : undefined;
  const q = sp.q?.trim();
  const invoices = await listInvoices({ status, q });
  const hasFilters = Boolean(status || q);

  return (
    <>
      <AdminPageHeader
        title="Invoice"
        icon="🧾"
        description="Invoice dibuat otomatis dari pesanan dan status pembayaran. Buka invoice untuk cetak atau simpan sebagai PDF."
      />

      <form method="get" className="mb-4 rounded-lg border border-stone-200/80 bg-white p-4">
        <div className="grid gap-2 md:grid-cols-[1.8fr_0.8fr_auto]">
          <input
            name="q"
            defaultValue={q ?? ""}
            placeholder="Cari invoice, nomor pesanan, nama, atau no HP..."
            className={inputClass()}
          />
          <select name="status" defaultValue={status ?? ""} className={inputClass()}>
            <option value="">Semua status</option>
            {STATUSES.map((item) => (
              <option key={item} value={item}>
                {item}
              </option>
            ))}
          </select>
          <button
            type="submit"
            className="inline-flex items-center justify-center rounded-md bg-stone-900 px-3 py-2 text-sm font-medium text-white transition hover:bg-stone-800"
          >
            Filter
          </button>
        </div>
        {hasFilters ? (
          <div className="mt-3 flex justify-end">
            <Link href="/admin/invoices" className="text-xs font-medium text-stone-500 hover:text-stone-900">
              Reset filter
            </Link>
          </div>
        ) : null}
      </form>

      {invoices.length === 0 ? (
        <EmptyState
          icon="🧾"
          title="Tidak ada invoice"
          description={hasFilters ? "Coba ubah filter atau reset." : "Invoice muncul otomatis dari pesanan."}
        />
      ) : (
        <div className="overflow-x-auto rounded-lg border border-stone-200/80 bg-white">
          <table className="w-full min-w-[860px] text-left text-sm">
            <thead className="bg-stone-50/70 text-[11px] font-semibold uppercase tracking-wider text-stone-500">
              <tr>
                <th className="px-4 py-2.5">Invoice</th>
                <th className="px-4 py-2.5">Customer</th>
                <th className="px-4 py-2.5">Pickup</th>
                <th className="px-4 py-2.5">Status</th>
                <th className="px-4 py-2.5 text-right">Total</th>
                <th className="px-4 py-2.5 text-right">Sisa</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-stone-100">
              {invoices.map((invoice) => (
                <tr key={invoice.id} className="transition hover:bg-stone-50/70">
                  <td className="px-4 py-3">
                    <Link
                      href={`/admin/invoices/${invoice.orderNumber}`}
                      className="font-medium text-stone-900 hover:underline"
                    >
                      {invoice.invoiceNumber}
                    </Link>
                    <p className="text-xs text-stone-500">{invoice.orderNumber}</p>
                  </td>
                  <td className="px-4 py-3">
                    <p className="font-medium text-stone-900">{invoice.recipientName}</p>
                    <p className="text-xs text-stone-500">Dari {invoice.senderName}</p>
                  </td>
                  <td className="px-4 py-3 text-stone-600">
                    {formatShortDate(invoice.deliveryDate.toISOString())}
                  </td>
                  <td className="px-4 py-3">
                    <span className={tagClass(STATUS_TONE[invoice.status])}>{invoice.status}</span>
                  </td>
                  <td className="px-4 py-3 text-right font-medium text-stone-900">{formatIDR(invoice.total)}</td>
                  <td className="px-4 py-3 text-right text-stone-700">{formatIDR(invoice.balanceDue)}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </>
  );
}
