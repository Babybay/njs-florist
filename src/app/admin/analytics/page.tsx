import Link from "next/link";
import { AdminPageHeader } from "@/components/admin/admin-shell";
import { DailyLedger } from "@/components/admin/daily-ledger";
import { RevenueChart } from "@/components/admin/revenue-chart";
import { formatIDR } from "@/lib/money";
import {
  conversionStats,
  dailyRevenue,
  revenueSummary,
  topVariants,
  totalRevenueAllTime,
} from "@/server/services/analytics.service";
import { listLowStockItems } from "@/server/services/inventory.service";
import { listStores } from "@/server/services/store.service";
import { db } from "@/lib/db";

export const metadata = {
  title: "Admin Analytics",
};

export const dynamic = "force-dynamic";

const RANGES = [7, 30, 90] as const;
type Range = (typeof RANGES)[number];

function parseRange(value?: string): Range {
  const n = Number(value);
  return (RANGES as readonly number[]).includes(n) ? (n as Range) : 30;
}

export default async function AdminAnalyticsPage({
  searchParams,
}: {
  searchParams: Promise<{ range?: string }>;
}) {
  const sp = await searchParams;
  const range = parseRange(sp.range);

  const [revenue, summary, top, conversion, allTime, lowStock, stores, byStore] = await Promise.all([
    dailyRevenue(range),
    revenueSummary(range),
    topVariants(10),
    conversionStats(),
    totalRevenueAllTime(),
    listLowStockItems(),
    listStores(),
    db.order.groupBy({
      by: ["storeId"],
      where: {
        status: { in: ["PAID", "PREPARING", "READY_FOR_DELIVERY", "OUT_FOR_DELIVERY", "DELIVERED", "COMPLETED"] },
      },
      _count: { _all: true },
      _sum: { total: true },
    }),
  ]);

  const storeNameById = new Map(stores.map((s) => [s.id, s.name]));
  const storeRows = byStore.map((row) => ({
    name: storeNameById.get(row.storeId) ?? "—",
    orders: row._count._all,
    revenue: row._sum.total ?? 0,
  }));

  const delta = summary.deltaPct;
  const deltaUp = delta !== null && delta >= 0;
  const bestDayLabel = summary.bestDay
    ? new Date(summary.bestDay.date).toLocaleDateString("id-ID", { day: "numeric", month: "short" })
    : null;

  return (
    <>
      <AdminPageHeader
        title="Analytics"
        description="Pendapatan harian, varian terlaris, dan konversi untuk tracking akunting toko."
      />

      <div className="mb-4 flex flex-wrap items-center justify-between gap-2">
        <div className="inline-flex rounded-lg border border-stone-200 bg-white p-0.5">
          {RANGES.map((r) => {
            const activeRange = r === range;
            return (
              <Link
                key={r}
                href={`/admin/analytics?range=${r}`}
                scroll={false}
                className={`rounded-md px-3 py-1.5 text-sm font-medium transition ${
                  activeRange
                    ? "bg-stone-900 text-white"
                    : "text-stone-600 hover:bg-stone-100"
                }`}
              >
                {r} hari
              </Link>
            );
          })}
        </div>
        <Link
          href="/admin/orders"
          className="text-sm font-medium text-rose-700 hover:text-rose-900"
        >
          Buka semua pesanan →
        </Link>
      </div>

      <section className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
        <div className="rounded-lg bg-white p-5 shadow-sm">
          <p className="text-sm text-stone-500">Pendapatan {range} hari</p>
          <p className="mt-2 text-2xl font-semibold text-stone-950">{formatIDR(summary.revenue)}</p>
          <p className="mt-1 flex items-center gap-1.5 text-xs">
            {delta === null ? (
              <span className="text-stone-500">Belum ada data periode sebelumnya</span>
            ) : (
              <>
                <span
                  className={`inline-flex items-center rounded-full px-1.5 py-0.5 font-semibold ${
                    deltaUp ? "bg-emerald-50 text-emerald-700" : "bg-rose-50 text-rose-700"
                  }`}
                >
                  {deltaUp ? "▲" : "▼"} {Math.abs(delta).toFixed(1)}%
                </span>
                <span className="text-stone-500">vs {range} hari sebelumnya</span>
              </>
            )}
          </p>
        </div>
        <div className="rounded-lg bg-white p-5 shadow-sm">
          <p className="text-sm text-stone-500">Pesanan terbayar</p>
          <p className="mt-2 text-2xl font-semibold text-stone-950">{summary.orders}</p>
          <p className="mt-1 text-xs text-stone-500">{summary.itemsSold} item terjual</p>
        </div>
        <div className="rounded-lg bg-white p-5 shadow-sm">
          <p className="text-sm text-stone-500">Rata-rata / pesanan (AOV)</p>
          <p className="mt-2 text-2xl font-semibold text-stone-950">{formatIDR(summary.aov)}</p>
          <p className="mt-1 text-xs text-stone-500">
            {bestDayLabel
              ? `Hari terbaik ${bestDayLabel} · ${formatIDR(summary.bestDay!.revenue)}`
              : "Belum ada penjualan"}
          </p>
        </div>
        <div className="rounded-lg bg-white p-5 shadow-sm">
          <p className="text-sm text-stone-500">Konversi</p>
          <p className="mt-2 text-2xl font-semibold text-stone-950">
            {(conversion.rate * 100).toFixed(1)}%
          </p>
          <p className="mt-1 text-xs text-stone-500">
            {conversion.paid}/{conversion.total} pesanan jadi
          </p>
        </div>
      </section>

      <section className="mt-4 grid gap-4 md:grid-cols-2">
        <div className="rounded-lg bg-white p-5 shadow-sm">
          <p className="text-sm text-stone-500">Revenue total (all-time)</p>
          <p className="mt-2 text-2xl font-semibold text-stone-950">{formatIDR(allTime)}</p>
          <p className="mt-1 text-xs text-stone-500">Semua pesanan terbayar</p>
        </div>
        <Link
          href="/admin/inventory"
          className={`block rounded-lg p-5 shadow-sm transition ${
            lowStock.length > 0 ? "bg-amber-50 hover:bg-amber-100/70" : "bg-white hover:bg-stone-50"
          }`}
        >
          <p className="text-sm text-stone-500">Bahan low stock</p>
          <p
            className={`mt-2 text-2xl font-semibold ${
              lowStock.length > 0 ? "text-amber-800" : "text-stone-950"
            }`}
          >
            {lowStock.length}
          </p>
          <p className="mt-1 text-xs text-stone-500">
            {lowStock.length > 0 ? "Perlu restock — buka inventori →" : "Semua aman"}
          </p>
        </Link>
      </section>

      <section className="mt-6">
        <RevenueChart data={revenue} />
      </section>

      <section className="mt-6">
        <DailyLedger data={revenue} />
      </section>

      <section className="mt-6 rounded-lg border border-stone-200 bg-white p-5 shadow-sm">
        <h2 className="text-lg font-semibold text-stone-950">Per toko</h2>
        <p className="mt-1 text-sm text-stone-600">Jumlah pesanan dan revenue terbayar per lokasi pickup (all-time).</p>
        {storeRows.length === 0 ? (
          <p className="mt-4 text-sm text-stone-500">Belum ada data.</p>
        ) : (
          <ul className="mt-4 grid gap-2 text-sm">
            {storeRows.map((r) => (
              <li key={r.name} className="flex items-center justify-between border-b border-stone-100 pb-2 last:border-b-0">
                <span className="font-semibold text-stone-950">{r.name}</span>
                <span className="text-stone-600">{r.orders} pesanan · {formatIDR(r.revenue)}</span>
              </li>
            ))}
          </ul>
        )}
      </section>

      <section className="mt-6 rounded-lg border border-stone-200 bg-white p-5 shadow-sm">
        <h2 className="text-lg font-semibold text-stone-950">Varian terlaris</h2>
        <p className="mt-1 text-sm text-stone-600">Berdasarkan total kuantitas pada pesanan yang sudah terbayar.</p>
        {top.length === 0 ? (
          <p className="mt-4 text-sm text-stone-500">Belum ada data.</p>
        ) : (
          <table className="mt-4 w-full text-left text-sm">
            <thead>
              <tr className="border-b border-stone-200 text-xs uppercase tracking-wide text-stone-500">
                <th className="py-2">Produk</th>
                <th className="py-2">Varian</th>
                <th className="py-2 text-right">Qty</th>
                <th className="py-2 text-right">Revenue</th>
              </tr>
            </thead>
            <tbody>
              {top.map((row) => (
                <tr key={row.variantId} className="border-b border-stone-100 last:border-b-0">
                  <td className="py-2 font-semibold text-stone-950">{row.productName}</td>
                  <td className="py-2 text-stone-600">{row.variantName}</td>
                  <td className="py-2 text-right font-semibold text-stone-950">{row.quantity}</td>
                  <td className="py-2 text-right text-stone-950">{formatIDR(row.revenue)}</td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </section>
    </>
  );
}
