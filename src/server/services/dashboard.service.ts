import { cache } from "react";
import { unstable_cache } from "next/cache";
import { db } from "@/lib/db";
import type { OrderStatus, Prisma } from "@prisma/client";
import { pickupDateKey, pickupDayBounds } from "@/lib/pickup-schedule";

const PAID_STATUSES: OrderStatus[] = [
  "PAID",
  "PREPARING",
  "READY_FOR_DELIVERY",
  "OUT_FOR_DELIVERY",
  "DELIVERED",
  "COMPLETED",
];

export const DASHBOARD_TAGS = {
  stats: "dashboard-stats",
  recentOrders: "dashboard-recent-orders",
  lowStock: "dashboard-low-stock",
} as const;

/**
 * Count of ACTIVE products. Single `SELECT COUNT(*)`.
 * Cached 60s — product status rarely flips minute-to-minute.
 */
export const getActiveProductCount = unstable_cache(
  async () => db.product.count({ where: { status: "ACTIVE" } }),
  ["dashboard-product-count"],
  { tags: [DASHBOARD_TAGS.stats], revalidate: 60 },
);

/**
 * Recent orders for the dashboard list. Dedupe via React.cache so the
 * stat card and the list section share a single DB hit per request.
 */
export const getRecentOrders = cache(async (limit = 6) => {
  return db.order.findMany({
    select: {
      id: true,
      orderNumber: true,
      status: true,
      recipientName: true,
      total: true,
      deliveryDate: true,
      createdAt: true,
    },
    orderBy: { createdAt: "desc" },
    take: limit,
  });
});

/**
 * Sum of revenue from all paid+ orders. Pushed to DB as a single SUM.
 * Cached 60s.
 */
export const getPaidRevenueTotal = unstable_cache(
  async () => {
    const result = await db.order.aggregate({
      where: { status: { in: PAID_STATUSES } },
      _sum: { total: true },
    });
    return result._sum.total ?? 0;
  },
  ["dashboard-paid-revenue"],
  { tags: [DASHBOARD_TAGS.stats], revalidate: 60 },
);

// Low stock lives in inventory.service.ts (listLowStockItems) — single source.

/** Full-day counts are independent of the six-row recent orders list. */
export async function loadTodayOrderSummary(client: Pick<Prisma.TransactionClient, "order"> = db, now = new Date()) {
  const { start, end } = pickupDayBounds(pickupDateKey(now));
  const [created, pickups] = await Promise.all([
    client.order.groupBy({ by: ["status"], where: { createdAt: { gte: start, lt: end } }, _count: { _all: true } }),
    client.order.groupBy({ by: ["status"], where: { deliveryDate: { gte: start, lt: end }, status: { in: ["PAID", "PREPARING", "READY_FOR_DELIVERY", "OUT_FOR_DELIVERY"] } }, _count: { _all: true } }),
  ]);
  return {
    created: created.reduce((sum, row) => sum + row._count._all, 0),
    pendingPayment: created.find((row) => row.status === "PENDING_PAYMENT")?._count._all ?? 0,
    pickups: pickups.reduce((sum, row) => sum + row._count._all, 0),
    ready: pickups.find((row) => row.status === "READY_FOR_DELIVERY")?._count._all ?? 0,
  };
}
export const getTodayOrderSummary = cache(() => loadTodayOrderSummary());
