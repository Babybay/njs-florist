import { db } from "@/lib/db";
import type { OrderStatus } from "@/types/order";

export async function updateOrderStatus(orderId: string, status: OrderStatus) {
  return db.order.update({
    where: { id: orderId },
    data: { status },
  });
}

export async function findOrderByNumber(orderNumber: string) {
  return db.order.findUnique({
    where: { orderNumber },
    include: { items: true, payments: true, reservations: true },
  });
}

export async function listOrders(filter?: {
  statuses?: OrderStatus[];
  limit?: number;
  userId?: string;
  q?: string;
  fromDate?: Date;
  toDate?: Date;
}) {
  const where: Record<string, unknown> = {};
  if (filter?.statuses && filter.statuses.length) where.status = { in: filter.statuses };
  if (filter?.userId) where.userId = filter.userId;
  if (filter?.q) {
    where.OR = [
      { orderNumber: { contains: filter.q, mode: "insensitive" } },
      { recipientName: { contains: filter.q, mode: "insensitive" } },
      { recipientPhone: { contains: filter.q } },
    ];
  }
  if (filter?.fromDate || filter?.toDate) {
    const range: Record<string, Date> = {};
    if (filter.fromDate) range.gte = filter.fromDate;
    if (filter.toDate) range.lte = filter.toDate;
    where.createdAt = range;
  }

  return db.order.findMany({
    where: Object.keys(where).length ? where : undefined,
    include: { items: true, payments: true },
    orderBy: { createdAt: "desc" },
    take: filter?.limit,
  });
}

export async function listOrdersForStaffFlorist() {
  return db.order.findMany({
    where: { status: { in: ["PAID", "PREPARING"] } },
    include: { items: { include: { addons: true } } },
    orderBy: [{ deliveryDate: "asc" }, { createdAt: "asc" }],
  });
}

export async function listOrdersForStaffDelivery() {
  return db.order.findMany({
    where: { status: { in: ["READY_FOR_DELIVERY", "OUT_FOR_DELIVERY"] } },
    include: { items: { include: { addons: true } } },
    orderBy: [{ deliveryDate: "asc" }, { createdAt: "asc" }],
  });
}
