import { cache } from "react";
import { unstable_cache } from "next/cache";
import { db } from "@/lib/db";
import type { OrderStatus } from "@prisma/client";

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
