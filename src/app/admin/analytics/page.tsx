import { AdminPageHeader } from "@/components/admin/admin-shell";
import { RevenueChart } from "@/components/admin/revenue-chart";
import { formatIDR } from "@/lib/money";
import {
  conversionStats,
  dailyRevenue,
  topVariants,
  totalRevenueAllTime,
} from "@/server/services/analytics.service";
import { listLowStockItems } from "@/server/services/inventory.service";

export const metadata = {
  title: "Admin Analytics",
};

export const dynamic = "force-dynamic";

export default async function AdminAnalyticsPage() {
  const [revenue, top, conversion, allTime, lowStock] = await Promise.all([
    dailyRevenue(30),
    topVariants(10),
    conversionStats(),
    totalRevenueAllTime(),
    listLowStockItems(),
  ]);

  const last30Revenue = revenue.reduce((acc, p) => acc + p.revenue, 0);
  const last30Orders = revenue.reduce((acc, p) => acc + p.orders, 0);

  return (
    <>
      <AdminPageHeader
        title="Analytics"
        description="Ringkasan revenue, varian terlaris, dan konversi dari sisi backend."
      />

      <section className="grid gap-4 md:grid-cols-4">
        <div className="rounded-lg bg-white p-5 shadow-sm">
          <p className="text-sm text-stone-500">Revenue 30 hari</p>
          <p className="mt-2 text-2xl font-semibold text-stone-950">{formatIDR(last30Revenue)}</p>
          <p className="mt-1 text-xs text-stone-500">{last30Orders} pesanan terbayar</p>
        </div>
        <div className="rounded-lg bg-white p-5 shadow-sm">
          <p className="text-sm text-stone-500">Revenue total</p>
          <p className="mt-2 text-2xl font-semibold text-stone-950">{formatIDR(allTime)}</p>
          <p className="mt-1 text-xs text-stone-500">Semua pesanan terbayar</p>
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
        <div
          className={`rounded-lg p-5 shadow-sm ${
            lowStock.length > 0 ? "bg-amber-50" : "bg-white"
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
          <p className="mt-1 text-xs text-stone-500">Periksa /admin/inventory</p>
        </div>
      </section>

      <section className="mt-6">
        <RevenueChart data={revenue} />
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
