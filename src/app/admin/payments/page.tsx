import Link from "next/link";
import { db } from "@/lib/db";
import { AdminPageHeader } from "@/components/admin/admin-shell";
import { Button, EmptyState, inputClass, tagClass } from "@/components/admin/ui";
import { formatDateTime, formatIDR } from "@/lib/money";
import type { PaymentStatus } from "@prisma/client";

export const metadata = {
  title: "Admin Pembayaran",
};

export const dynamic = "force-dynamic";

const ALL_STATUSES: PaymentStatus[] = [
  "PENDING",
  "PAID",
  "FAILED",
  "EXPIRED",
  "CANCELLED",
  "REFUNDED",
];

const TONE: Record<PaymentStatus, Parameters<typeof tagClass>[0]> = {
  PENDING: "amber",
  PAID: "emerald",
  FAILED: "rose",
  EXPIRED: "neutral",
  CANCELLED: "neutral",
  REFUNDED: "sky",
};

export default async function AdminPaymentsPage({
  searchParams,
}: {
  searchParams: Promise<{ status?: string; q?: string }>;
}) {
  const sp = await searchParams;
  const selected = sp.status
    ? (sp.status.split(",").filter((s) => ALL_STATUSES.includes(s as PaymentStatus)) as PaymentStatus[])
    : [];
  const q = sp.q?.trim();

  const payments = await db.payment.findMany({
    where: {
      ...(selected.length ? { status: { in: selected } } : {}),
      ...(q
        ? {
            OR: [
              { providerOrderId: { contains: q, mode: "insensitive" } },
              { order: { orderNumber: { contains: q, mode: "insensitive" } } },
            ],
          }
        : {}),
    },
    include: { order: { select: { id: true, orderNumber: true, recipientName: true } } },
    orderBy: { createdAt: "desc" },
    take: 100,
  });

  return (
    <>
      <AdminPageHeader
        title="Pembayaran"
        icon="💳"
        description="Catatan pembayaran Midtrans Snap. Klik order untuk membuka detail dan riwayat status."
      />

      <form
        method="get"
        className="mb-4 rounded-lg border border-stone-200/80 bg-white p-4"
      >
        <div className="grid gap-2 md:grid-cols-[2fr_auto]">
          <input
            name="q"
            defaultValue={q ?? ""}
            placeholder="Cari nomor pesanan atau provider order ID..."
            className={inputClass()}
          />
          <Button type="submit" variant="primary">Filter</Button>
        </div>
        <div className="mt-3 flex flex-wrap gap-1.5">
          {ALL_STATUSES.map((s) => {
            const checked = selected.includes(s);
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
          {sp.status || sp.q ? (
            <Link
              href="/admin/payments"
              className="ml-auto text-xs font-medium text-stone-500 hover:text-stone-900"
            >
              ✕ Reset
            </Link>
          ) : null}
        </div>
      </form>

      {payments.length === 0 ? (
        <EmptyState icon="💳" title="Tidak ada pembayaran" description="Pembayaran baru akan muncul di sini setelah customer checkout." />
      ) : (
        <div className="overflow-hidden rounded-lg border border-stone-200/80 bg-white">
          <table className="w-full min-w-[760px] text-left text-sm">
            <thead className="bg-stone-50/70 text-[11px] font-semibold uppercase tracking-wider text-stone-500">
              <tr>
                <th className="px-4 py-2.5">Order</th>
                <th className="px-4 py-2.5">Provider ID</th>
                <th className="px-4 py-2.5">Status</th>
                <th className="px-4 py-2.5">Jumlah</th>
                <th className="px-4 py-2.5">Dibuat</th>
                <th className="px-4 py-2.5">Dibayar</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-stone-100">
              {payments.map((payment) => (
                <tr key={payment.id} className="transition hover:bg-stone-50/70">
                  <td className="px-4 py-3">
                    <Link
                      href={`/admin/orders/${payment.order.id}`}
                      className="font-medium text-stone-900 hover:underline"
                    >
                      {payment.order.orderNumber}
                    </Link>
                    <p className="text-xs text-stone-500">{payment.order.recipientName}</p>
                  </td>
                  <td className="px-4 py-3 font-mono text-xs text-stone-600">{payment.providerOrderId}</td>
                  <td className="px-4 py-3">
                    <span className={tagClass(TONE[payment.status])}>{payment.status}</span>
                  </td>
                  <td className="px-4 py-3 font-medium text-stone-900">{formatIDR(payment.amount)}</td>
                  <td className="px-4 py-3 text-stone-600">{formatDateTime(payment.createdAt)}</td>
                  <td className="px-4 py-3 text-stone-600">
                    {payment.paidAt ? formatDateTime(payment.paidAt) : "—"}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </>
  );
}
