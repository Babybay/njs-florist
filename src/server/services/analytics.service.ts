import { db } from "@/lib/db";
import { startOfDay } from "@/lib/utils";

const REVENUE_STATUSES = [
  "PAID",
  "PREPARING",
  "READY_FOR_DELIVERY",
  "OUT_FOR_DELIVERY",
  "DELIVERED",
  "COMPLETED",
] as const;

export type DailyRevenuePoint = {
  date: string;
  revenue: number;
  orders: number;
  itemsSold: number;
};

export async function dailyRevenue(days = 30): Promise<DailyRevenuePoint[]> {
  const today = startOfDay(new Date());
  const start = new Date(today);
  start.setDate(start.getDate() - (days - 1));

  const orders = await db.order.findMany({
    where: {
      createdAt: { gte: start },
      status: { in: [...REVENUE_STATUSES] },
    },
    select: {
      createdAt: true,
      total: true,
      items: { select: { quantity: true } },
    },
  });

  const map = new Map<string, { revenue: number; orders: number; itemsSold: number }>();
  for (let i = 0; i < days; i++) {
    const d = new Date(start);
    d.setDate(d.getDate() + i);
    map.set(d.toISOString().slice(0, 10), { revenue: 0, orders: 0, itemsSold: 0 });
  }
  for (const o of orders) {
    const key = startOfDay(o.createdAt).toISOString().slice(0, 10);
    const row = map.get(key);
    if (!row) continue;
    row.revenue += o.total;
    row.orders += 1;
    row.itemsSold += o.items.reduce((acc, it) => acc + it.quantity, 0);
  }

  return Array.from(map.entries()).map(([date, v]) => ({ date, ...v }));
}

export type RevenueSummary = {
  days: number;
  revenue: number;
  orders: number;
  itemsSold: number;
  aov: number;
  prevRevenue: number;
  deltaPct: number | null;
  bestDay: { date: string; revenue: number } | null;
};

/**
 * Period totals plus a comparison against the immediately preceding window of
 * the same length — gives the dashboard a trackable "naik/turun" signal.
 */
export async function revenueSummary(days = 30): Promise<RevenueSummary> {
  const current = await dailyRevenue(days);
  const revenue = current.reduce((a, p) => a + p.revenue, 0);
  const orders = current.reduce((a, p) => a + p.orders, 0);
  const itemsSold = current.reduce((a, p) => a + p.itemsSold, 0);

  const today = startOfDay(new Date());
  const currentStart = new Date(today);
  currentStart.setDate(currentStart.getDate() - (days - 1));
  const prevStart = new Date(currentStart);
  prevStart.setDate(prevStart.getDate() - days);

  const prev = await db.order.aggregate({
    _sum: { total: true },
    where: {
      createdAt: { gte: prevStart, lt: currentStart },
      status: { in: [...REVENUE_STATUSES] },
    },
  });
  const prevRevenue = prev._sum.total ?? 0;

  const bestDay = current.reduce<{ date: string; revenue: number } | null>((best, p) => {
    if (p.revenue <= 0) return best;
    if (!best || p.revenue > best.revenue) return { date: p.date, revenue: p.revenue };
    return best;
  }, null);

  return {
    days,
    revenue,
    orders,
    itemsSold,
    aov: orders === 0 ? 0 : Math.round(revenue / orders),
    prevRevenue,
    deltaPct: prevRevenue === 0 ? null : ((revenue - prevRevenue) / prevRevenue) * 100,
    bestDay,
  };
}

export async function topVariants(limit = 10) {
  const rows = await db.orderItem.groupBy({
    by: ["variantId", "productName", "variantName"],
    _sum: { quantity: true, totalPrice: true },
    where: {
      order: { status: { in: [...REVENUE_STATUSES] } },
    },
    orderBy: { _sum: { quantity: "desc" } },
    take: limit,
  });

  return rows.map((row) => ({
    variantId: row.variantId,
    productName: row.productName,
    variantName: row.variantName,
    quantity: row._sum.quantity ?? 0,
    revenue: row._sum.totalPrice ?? 0,
  }));
}

export async function conversionStats() {
  const [all, paid] = await Promise.all([
    db.order.count(),
    db.order.count({ where: { status: { in: [...REVENUE_STATUSES] } } }),
  ]);
  return {
    total: all,
    paid,
    rate: all === 0 ? 0 : paid / all,
  };
}

export async function totalRevenueAllTime() {
  const result = await db.order.aggregate({
    _sum: { total: true },
    where: { status: { in: [...REVENUE_STATUSES] } },
  });
  return result._sum.total ?? 0;
}
