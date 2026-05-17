"use server";

import { revalidatePath } from "next/cache";
import { requireAdmin, requireStaff } from "@/server/services/auth.service";
import { transitionOrderStatus } from "@/server/services/order-status.service";
import type { OrderStatus, Role } from "@/types/order";

const FLORIST_TRANSITIONS: OrderStatus[] = ["PREPARING", "READY_FOR_DELIVERY"];
const DELIVERY_TRANSITIONS: OrderStatus[] = [
  "OUT_FOR_DELIVERY",
  "DELIVERED",
  "COMPLETED",
];

async function runTransition(
  staffRole: Extract<Role, "FLORIST_STAFF" | "DELIVERY_STAFF">,
  allowed: OrderStatus[],
  formData: FormData,
) {
  const user = await requireStaff(staffRole);

  const orderId = String(formData.get("orderId") ?? "");
  const toStatus = String(formData.get("toStatus") ?? "") as OrderStatus;
  const note = String(formData.get("note") ?? "").trim() || null;

  if (!orderId) throw new Error("orderId is required.");
  if (!allowed.includes(toStatus)) {
    throw new Error(`Transisi ${toStatus} tidak diizinkan untuk role ini.`);
  }

  await transitionOrderStatus({
    orderId,
    toStatus,
    actorId: user.id,
    actorRole: user.role,
    note,
  });

  revalidatePath("/staff/florist");
  revalidatePath("/staff/delivery");
  revalidatePath("/admin/orders");
}

export async function floristTransitionAction(formData: FormData) {
  return runTransition("FLORIST_STAFF", FLORIST_TRANSITIONS, formData);
}

export async function deliveryTransitionAction(formData: FormData) {
  return runTransition("DELIVERY_STAFF", DELIVERY_TRANSITIONS, formData);
}

const ADMIN_TRANSITIONS: OrderStatus[] = [
  "PREPARING",
  "READY_FOR_DELIVERY",
  "OUT_FOR_DELIVERY",
  "DELIVERED",
  "COMPLETED",
  "CANCELLED",
  "REFUNDED",
];

export async function adminTransitionAction(formData: FormData) {
  const user = await requireAdmin();
  const orderId = String(formData.get("orderId") ?? "");
  const toStatus = String(formData.get("toStatus") ?? "") as OrderStatus;
  const note = String(formData.get("note") ?? "").trim() || null;

  if (!orderId) throw new Error("orderId is required.");
  if (!ADMIN_TRANSITIONS.includes(toStatus)) {
    throw new Error(`Transisi ${toStatus} tidak diizinkan dari admin.`);
  }

  await transitionOrderStatus({
    orderId,
    toStatus,
    actorId: user.id,
    actorRole: user.role,
    note,
  });

  revalidatePath("/admin/orders");
  revalidatePath(`/admin/orders/${orderId}`);
}
