import { PrismaClient } from "@prisma/client";
import { transitionOrderStatus, listOrderStatusHistory } from "../src/server/services/order-status.service";

const db = new PrismaClient();

async function main() {
  // Build a throwaway order in PAID state. Real flow gets here via webhook.
  const slot = await db.deliverySlot.findFirst({ where: { isActive: true } });
  if (!slot) throw new Error("No active delivery slot.");
  const order = await db.order.create({
    data: {
      orderNumber: `SMOKE-STATUS-${Date.now()}`,
      status: "PAID",
      subtotal: 100000,
      deliveryFee: 0,
      discountAmount: 0,
      total: 100000,
      recipientName: "Smoke Tester",
      recipientPhone: "0000000000",
      senderName: "Smoke",
      deliveryDate: new Date(Date.now() + 86_400_000),
      deliverySlotId: slot.id,
      storeId: slot.storeId,
      deliveryAddress: "Smoke address",
    },
  });

  const startStatus = order.status;

  await transitionOrderStatus({
    orderId: order.id,
    toStatus: "PREPARING",
    note: "smoke: started prep",
  });
  await transitionOrderStatus({
    orderId: order.id,
    toStatus: "READY_FOR_DELIVERY",
    note: "smoke: ready",
  });
  await transitionOrderStatus({
    orderId: order.id,
    toStatus: "OUT_FOR_DELIVERY",
    note: "smoke: picked up",
  });
  await transitionOrderStatus({
    orderId: order.id,
    toStatus: "DELIVERED",
    note: "smoke: delivered",
  });

  // Should reject invalid transition
  let invalidThrew = false;
  try {
    await transitionOrderStatus({ orderId: order.id, toStatus: "PAID" });
  } catch {
    invalidThrew = true;
  }

  const history = await listOrderStatusHistory(order.id);
  const final = await db.order.findUnique({ where: { id: order.id } });

  console.log(
    JSON.stringify(
      {
        orderId: order.id,
        orderNumber: order.orderNumber,
        startStatus,
        finalStatus: final?.status,
        historyCount: history.length,
        historyTransitions: history.map((h) => `${h.fromStatus ?? "∅"}→${h.toStatus}`),
        invalidTransitionRejected: invalidThrew,
      },
      null,
      2,
    ),
  );

  // Cleanup: throwaway order + history rows.
  await db.orderStatusHistory.deleteMany({ where: { orderId: order.id } });
  await db.order.delete({ where: { id: order.id } });
  void startStatus;
}

main()
  .catch((e) => {
    console.error("ERR", e);
    process.exit(1);
  })
  .finally(() => db.$disconnect());
