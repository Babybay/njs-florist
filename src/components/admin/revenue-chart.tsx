import { formatIDR } from "@/lib/money";

type Point = { date: string; revenue: number; orders: number };

export function RevenueChart({ data }: { data: Point[] }) {
  const max = Math.max(...data.map((p) => p.revenue), 1);

  return (
    <div className="rounded-lg border border-stone-200 bg-white p-5 shadow-sm">
      <h2 className="text-lg font-semibold text-stone-950">Revenue {data.length} hari terakhir</h2>
      <p className="mt-1 text-sm text-stone-600">
        Total {data.reduce((a, p) => a + p.orders, 0)} pesanan ·{" "}
        {formatIDR(data.reduce((a, p) => a + p.revenue, 0))}
      </p>
      <div className="mt-6 flex h-40 items-end gap-1">
        {data.map((p) => {
          const heightPct = (p.revenue / max) * 100;
          const label = new Date(p.date).toLocaleDateString("id-ID", {
            day: "numeric",
            month: "short",
          });
          return (
            <div key={p.date} className="group flex flex-1 flex-col items-center">
              <div
                title={`${label}: ${formatIDR(p.revenue)} (${p.orders} pesanan)`}
                className="w-full rounded-t bg-rose-700/80 transition group-hover:bg-rose-900"
                style={{ height: `${heightPct}%`, minHeight: p.revenue > 0 ? "2px" : "0" }}
              />
            </div>
          );
        })}
      </div>
      <div className="mt-2 flex justify-between text-[10px] text-stone-500">
        <span>{new Date(data[0]?.date ?? "").toLocaleDateString("id-ID", { day: "numeric", month: "short" })}</span>
        <span>{new Date(data[data.length - 1]?.date ?? "").toLocaleDateString("id-ID", { day: "numeric", month: "short" })}</span>
      </div>
    </div>
  );
}
