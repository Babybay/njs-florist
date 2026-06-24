import { revalidateTag } from "next/cache";
import { db } from "@/lib/db";
import {
  createMidtransSnapTransaction,
  fetchMidtransTransactionStatus,
  type SnapItemDetail,
  verifyMidtransSignature,
  type MidtransStatus,
} from "@/lib/midtrans";
import { DASHBOARD_TAGS } from "@/server/services/dashboard.service";
import { applyStockMovement } from "@/server/services/inventory.service";
import {
  notifyAdminNewPaidOrder,
  sendOrderConfirmationEmail,
} from "@/server/services/notification.service";

export function mapMidtransStatus(status: MidtransStatus) {
  switch (status) {
    case "settlement":
    case "capture":
      return { paymentStatus: "PAID" as const, orderStatus: "PAID" as const };
    case "pending":
      return { paymentStatus: "PENDING" as const, orderStatus: "PENDING_PAYMENT" as const };
    case "deny":
      return { paymentStatus: "FAILED" as const, orderStatus: "PAYMENT_FAILED" as const };
    case "expire":
      return { paymentStatus: "EXPIRED" as const, orderStatus: "EXPIRED" as const };
    case "cancel":
      return { paymentStatus: "CANCELLED" as const, orderStatus: "CANCELLED" as const };
    case "refund":
      return { paymentStatus: "REFUNDED" as const, orderStatus: "REFUNDED" as const };
  }
}

export async function createPaymentForOrder(order: { id: string; orderNumber: string; total: number }) {
  // Pull the persisted order with items + addons so Snap line items match gross_amount.
  const full = await db.order.findUnique({
    where: { id: order.id },
    include: {
      items: { include: { addons: true } },
      user: true,
    },
  });
  if (!full) throw new Error("Order not found when creating payment.");

  // Only orders still awaiting payment may start a Snap transaction. Blocks
  // creating a fresh charge for an order that is already paid, cancelled, or expired.
  if (full.status !== "PENDING_PAYMENT") {
    throw new Error(`Order ${full.orderNumber} is not awaiting payment (status: ${full.status}).`);
  }

  const items: SnapItemDetail[] = [];
  for (const item of full.items) {
    items.push({
      id: item.variantId,
      price: item.unitPrice,
      quantity: item.quantity,
      name: `${item.productName} - ${item.variantName}`.slice(0, 50),
    });
    for (const addon of item.addons) {
      items.push({
        id: `addon-${addon.addonId}`,
        price: addon.unitPrice,
        quantity: addon.quantity,
        name: `Add-on: ${addon.addonName}`.slice(0, 50),
      });
    }
  }
  if (full.deliveryFee > 0) {
    items.push({ id: "delivery-fee", price: full.deliveryFee, quantity: 1, name: "Delivery fee" });
  }
  if (full.discountAmount > 0) {
    items.push({ id: "discount", price: -full.discountAmount, quantity: 1, name: "Discount" });
  }

  const origin = process.env.NEXT_PUBLIC_APP_URL ?? "http://localhost:3000";

  return createMidtransSnapTransaction({
    orderNumber: full.orderNumber,
    total: full.total,
    items,
    customer: {
      firstName: full.recipientName.split(" ")[0],
      lastName: full.recipientName.split(" ").slice(1).join(" ") || undefined,
      email: full.user?.email,
      phone: full.recipientPhone,
    },
    callbacks: {
      finish: `${origin}/payment/success?order=${encodeURIComponent(full.orderNumber)}`,
    },
  });
}

export async function handleMidtransWebhook(payload: {
  order_id?: string;
  transaction_status?: MidtransStatus;
  status_code?: string;
  gross_amount?: string;
  signature_key?: string;
}) {
  if (!verifyMidtransSignature(payload)) {
    throw new Error("Invalid payment signature.");
  }

  if (!payload.order_id || !payload.transaction_status) {
    throw new Error("Invalid payment payload.");
  }

  const mappedStatus = mapMidtransStatus(payload.transaction_status);

  const result = await db.$transaction(async (tx) => {
    const payment = await tx.payment.findUnique({
      where: { providerOrderId: payload.order_id },
      include: { order: { include: { reservations: true } } },
    });

    if (!payment) throw new Error("Payment not found.");
    if (payment.status === "PAID") {
      return { alreadyProcessed: true, orderId: payment.orderId, paid: false };
    }

    await tx.payment.update({
      where: { id: payment.id },
      data: {
        status: mappedStatus.paymentStatus,
        rawResponse: payload,
        paidAt: mappedStatus.paymentStatus === "PAID" ? new Date() : null,
      },
    });

    const previousOrderStatus = payment.order.status;
    if (previousOrderStatus !== mappedStatus.orderStatus) {
      await tx.order.update({
        where: { id: payment.orderId },
        data: { status: mappedStatus.orderStatus },
      });
      await tx.orderStatusHistory.create({
        data: {
          orderId: payment.orderId,
          fromStatus: previousOrderStatus,
          toStatus: mappedStatus.orderStatus,
          note: `Midtrans: ${payload.transaction_status}`,
        },
      });
    }

    if (mappedStatus.paymentStatus === "PAID") {
      for (const reservation of payment.order.reservations) {
        if (reservation.status !== "ACTIVE") continue;

        await applyStockMovement(
          {
            inventoryItemId: reservation.inventoryItemId,
            type: "OUT",
            quantity: reservation.quantity,
            reason: `Order paid: ${payment.order.orderNumber}`,
            orderId: payment.orderId,
          },
          tx,
        );

        await tx.stockReservation.update({
          where: { id: reservation.id },
          data: { status: "COMMITTED" },
        });
      }
    }

    return {
      alreadyProcessed: false,
      orderId: payment.orderId,
      paid: mappedStatus.paymentStatus === "PAID",
    };
  });

  if (result.alreadyProcessed) {
    return { message: "Webhook already processed." };
  }

  if (result.paid) {
    revalidateTag(DASHBOARD_TAGS.stats, "max");
    try {
      await sendOrderConfirmationEmail(result.orderId);
    } catch (error) {
      console.error("Failed to send confirmation email", error);
    }
    notifyAdminNewPaidOrder(result.orderId).catch((err) =>
      console.error("Failed to notify admin", err),
    );
  }

  return { success: true };
}

/**
 * Manual pull from Midtrans Status API. Used as a fallback when webhooks
 * cannot reach the app (local dev) or get dropped in production.
 * Feeds the response back through the same handleMidtransWebhook code path
 * so all side-effects (stock commit, emails, WA) run identically.
 */
export async function syncOrderPaymentStatus(orderNumber: string) {
  const order = await db.order.findUnique({
    where: { orderNumber },
    select: { id: true, status: true },
  });
  if (!order) throw new Error("Order not found.");

  const status = await fetchMidtransTransactionStatus(orderNumber);
  await handleMidtransWebhook(status);

  const refreshed = await db.order.findUnique({
    where: { id: order.id },
    select: { status: true },
  });

  return {
    previousStatus: order.status,
    currentStatus: refreshed?.status ?? order.status,
    midtransStatus: status.transaction_status,
  };
}
