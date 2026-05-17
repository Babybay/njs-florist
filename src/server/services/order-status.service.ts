import type { Role as PrismaRole } from "@prisma/client";
import { db } from "@/lib/db";
import { sendOrderStatusEmail } from "@/server/services/notification.service";
import type { OrderStatus, Role } from "@/types/order";

function toPrismaRole(role: Role | null | undefined): PrismaRole | null {
  if (!role || role === "GUEST") return null;
  return role;
}

const ALLOWED: Record<OrderStatus, OrderStatus[]> = {
  DRAFT: ["PENDING_PAYMENT", "CANCELLED"],
  PENDING_PAYMENT: ["PAID", "PAYMENT_FAILED", "EXPIRED", "CANCELLED"],
  PAID: ["PREPARING", "CANCELLED", "REFUNDED"],
  PREPARING: ["READY_FOR_DELIVERY", "CANCELLED"],
  READY_FOR_DELIVERY: ["OUT_FOR_DELIVERY", "CANCELLED"],
  OUT_FOR_DELIVERY: ["DELIVERED", "CANCELLED"],
  DELIVERED: ["COMPLETED"],
  COMPLETED: [],
  PAYMENT_FAILED: ["PENDING_PAYMENT", "CANCELLED"],
  EXPIRED: [],
  CANCELLED: [],
  REFUNDED: [],
};

const NOTIFY_ON: OrderStatus[] = ["PREPARING", "OUT_FOR_DELIVERY", "DELIVERED"];

export type TransitionInput = {
  orderId: string;
  toStatus: OrderStatus;
  actorId?: string | null;
  actorRole?: Role | null;
  note?: string | null;
};

export async function transitionOrderStatus(input: TransitionInput) {
  const { orderId, toStatus, actorId = null, actorRole = null, note = null } = input;

  const order = await db.order.findUnique({ where: { id: orderId } });
  if (!order) throw new Error("Order not found.");
  if (order.status === toStatus) return order;

  const allowed = ALLOWED[order.status as OrderStatus] ?? [];
  if (!allowed.includes(toStatus)) {
    throw new Error(`Transisi tidak diizinkan: ${order.status} → ${toStatus}.`);
  }

  const fromStatus = order.status;
  const updated = await db.$transaction(async (tx) => {
    const next = await tx.order.update({
      where: { id: orderId },
      data: { status: toStatus },
    });
    await tx.orderStatusHistory.create({
      data: {
        orderId,
        fromStatus,
        toStatus,
        actorId,
        actorRole: toPrismaRole(actorRole),
        note,
      },
    });
    return next;
  });

  if (NOTIFY_ON.includes(toStatus)) {
    sendOrderStatusEmail(orderId, toStatus).catch((err) => {
      console.error("Status email failed:", err);
    });
  }

  return updated;
}

export async function listOrderStatusHistory(orderId: string) {
  return db.orderStatusHistory.findMany({
    where: { orderId },
    orderBy: { createdAt: "asc" },
  });
}
