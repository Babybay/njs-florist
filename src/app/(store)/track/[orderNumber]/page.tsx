import Link from "next/link";
import { notFound } from "next/navigation";
import { SiteFooter } from "@/components/layout/site-footer";
import { SiteHeader } from "@/components/layout/site-header";
import { StatusTimeline } from "@/components/order/status-timeline";
import { PageKicker } from "@/components/ui/store-ui";
import {
  formatPickupDate,
  statusLabel,
  statusToneClass,
} from "@/lib/order-display";
import { slotLabel } from "@/server/services/slot-display.service";
import { formatIDR } from "@/lib/money";
import { db } from "@/lib/db";

export const dynamic = "force-dynamic";

export default async function PublicTrackPage({
  params,
}: {
  params: Promise<{ orderNumber: string }>;
}) {
  const { orderNumber } = await params;
  const order = await db.order.findUnique({
    where: { orderNumber },
    include: {
      items: true,
      statusHistory: { orderBy: { createdAt: "asc" } },
    },
  });

  if (!order) notFound();
  const slot = await slotLabel(order.deliverySlotId);

  return (
    <>
      <SiteHeader />
      <main className="mx-auto max-w-3xl px-4 py-12 sm:px-6 lg:px-8">
        <Link
          href="/track"
          className="text-sm font-semibold uppercase tracking-[0.18em] text-black underline-offset-4 hover:underline"
        >
          ← Lacak pesanan lain
        </Link>
        <div className="mt-4">
          <PageKicker>Status pesanan</PageKicker>
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

        <section className="mt-8 rounded-md border border-stone-200 bg-white p-6">
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

        <section className="mt-6 rounded-md border border-stone-200 bg-white p-6">
          <h2 className="text-sm font-semibold uppercase tracking-[0.18em] text-black/60">
            Ringkasan
          </h2>
          <dl className="mt-4 grid gap-4 sm:grid-cols-2 text-sm">
            <div>
              <dt className="text-black/55">Jadwal pickup</dt>
              <dd className="mt-1 font-semibold text-black">
                {formatPickupDate(order.deliveryDate)}
              </dd>
              <dd className="text-xs text-black/65">{slot}</dd>
            </div>
            <div>
              <dt className="text-black/55">Total</dt>
              <dd className="mt-1 font-semibold text-black">{formatIDR(order.total)}</dd>
            </div>
            <div className="sm:col-span-2">
              <dt className="text-black/55">Atas nama</dt>
              <dd className="mt-1 font-semibold text-black">
                {order.recipientName} ({order.recipientPhone})
              </dd>
            </div>
          </dl>
        </section>
      </main>
      <SiteFooter />
    </>
  );
}
