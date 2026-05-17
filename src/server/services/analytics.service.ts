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

export type DailyRevenuePoint = { date: string; revenue: number; orders: number };

export async function dailyRevenue(days = 30): Promise<DailyRevenuePoint[]> {
  const today = startOfDay(new Date());
  const start = new Date(today);
  start.setDate(start.getDate() - (days - 1));

  const orders = await db.order.findMany({
    where: {
      createdAt: { gte: start },
      status: { in: [...REVENUE_STATUSES] },
    },
    select: { createdAt: true, total: true },
  });

  const map = new Map<string, { revenue: number; orders: number }>();
  for (let i = 0; i < days; i++) {
    const d = new Date(start);
    d.setDate(d.getDate() + i);
    map.set(d.toISOString().slice(0, 10), { revenue: 0, orders: 0 });
  }
  for (const o of orders) {
    const key = startOfDay(o.createdAt).toISOString().slice(0, 10);
    const row = map.get(key);
    if (!row) continue;
    row.revenue += o.total;
    row.orders += 1;
  }

  return Array.from(map.entries()).map(([date, v]) => ({ date, ...v }));
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
