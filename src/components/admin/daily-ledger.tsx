import Link from "next/link";
import { formatIDR } from "@/lib/money";
import type { DailyRevenuePoint } from "@/server/services/analytics.service";

type LedgerRow = DailyRevenuePoint & {
  aov: number;
  cumulative: number;
};

function buildRows(data: DailyRevenuePoint[]): LedgerRow[] {
  let running = 0;
  // Accumulate chronologically so the saldo berjalan is correct...
  const chronological = data.map((p) => {
    running += p.revenue;
    return {
      ...p,
      aov: p.orders === 0 ? 0 : Math.round(p.revenue / p.orders),
      cumulative: running,
    };
  });
  // ...then show the most recent day first.
  return chronological.reverse();
}

export function DailyLedger({ data }: { data: DailyRevenuePoint[] }) {
  const rows = buildRows(data);
  const active = rows.filter((r) => r.orders > 0).length;

  return (
    <div className="rounded-lg border border-stone-200/80 bg-white shadow-sm">
      <div className="flex items-center justify-between border-b border-stone-200/80 px-5 py-3">
        <div>
          <h2 className="text-sm font-semibold text-stone-900">Pembukuan harian</h2>
          <p className="text-xs text-stone-500">
            Pendapatan per hari dengan saldo berjalan · {active} dari {rows.length} hari ada transaksi
          </p>
        </div>
      </div>
      <div className="max-h-[28rem] overflow-y-auto">
        <table className="w-full text-left text-sm">
          <thead className="sticky top-0 z-10 bg-stone-50 text-xs uppercase tracking-wide text-stone-500">
            <tr className="border-b border-stone-200">
              <th className="px-5 py-2.5 font-medium">Tanggal</th>
              <th className="px-3 py-2.5 text-right font-medium">Pesanan</th>
              <th className="px-3 py-2.5 text-right font-medium">Item</th>
              <th className="px-3 py-2.5 text-right font-medium">Pendapatan</th>
              <th className="px-3 py-2.5 text-right font-medium">AOV</th>
              <th className="px-3 py-2.5 text-right font-medium">Saldo berjalan</th>
              <th className="px-5 py-2.5 text-right font-medium" />
            </tr>
          </thead>
          <tbody>
            {rows.map((row) => {
              const label = new Date(row.date).toLocaleDateString("id-ID", {
                weekday: "short",
                day: "numeric",
                month: "short",
              });
              const empty = row.orders === 0;
              return (
                <tr
                  key={row.date}
                  className={`border-b border-stone-100 last:border-b-0 ${
                    empty ? "text-stone-400" : "text-stone-700 hover:bg-stone-50/70"
                  }`}
                >
                  <td className="px-5 py-2.5 font-medium text-stone-900">{label}</td>
                  <td className="px-3 py-2.5 text-right tabular-nums">{row.orders || "—"}</td>
                  <td className="px-3 py-2.5 text-right tabular-nums">{row.itemsSold || "—"}</td>
                  <td className="px-3 py-2.5 text-right font-semibold tabular-nums text-stone-900">
                    {empty ? "—" : formatIDR(row.revenue)}
                  </td>
                  <td className="px-3 py-2.5 text-right tabular-nums">
                    {empty ? "—" : formatIDR(row.aov)}
                  </td>
                  <td className="px-3 py-2.5 text-right tabular-nums text-stone-500">
                    {formatIDR(row.cumulative)}
                  </td>
                  <td className="px-5 py-2.5 text-right">
                    {empty ? null : (
                      <Link
                        href={`/admin/orders?from=${row.date}&to=${row.date}`}
                        className="text-xs font-medium text-rose-700 hover:text-rose-900"
                      >
                        Lihat →
                      </Link>
                    )}
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
    </div>
  );
}
