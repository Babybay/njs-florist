"use server";

import { requireRole } from "@/lib/auth";
import { updateOrderStatus } from "@/server/services/order.service";
import type { OrderStatus } from "@/types/order";

export async function updatePreparationStatusAction(orderId: string, status: Extract<OrderStatus, "PREPARING" | "READY_FOR_DELIVERY">) {
  await requireRole(["SUPER_ADMIN", "ADMIN", "FLORIST_STAFF"]);
  return updateOrderStatus(orderId, status);
}

export async function updateDeliveryStatusAction(orderId: string, status: Extract<OrderStatus, "OUT_FOR_DELIVERY" | "DELIVERED">) {
  await requireRole(["SUPER_ADMIN", "ADMIN", "DELIVERY_STAFF"]);
  return updateOrderStatus(orderId, status);
}
