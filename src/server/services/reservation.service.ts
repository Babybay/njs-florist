import { db } from "@/lib/db";

export async function expireOrderReservations(orderId: string) {
  return db.stockReservation.updateMany({
    where: {
      orderId,
      status: "ACTIVE",
      expiresAt: { lt: new Date() },
    },
    data: { status: "EXPIRED" },
  });
}

export async function sweepExpiredReservations() {
  return db.$transaction(async (tx) => {
    const now = new Date();
    const expired = await tx.stockReservation.findMany({
      where: { status: "ACTIVE", expiresAt: { lt: now } },
      select: { id: true, orderId: true },
    });

    if (expired.length === 0) {
      return { reservationsExpired: 0, ordersExpired: 0 };
    }

    const reservationIds = expired.map((r) => r.id);
    const orderIds = Array.from(new Set(expired.map((r) => r.orderId)));

    await tx.stockReservation.updateMany({
      where: { id: { in: reservationIds } },
      data: { status: "EXPIRED" },
    });

    const updatedOrders = await tx.order.updateMany({
      where: { id: { in: orderIds }, status: "PENDING_PAYMENT" },
      data: { status: "EXPIRED" },
    });

    return {
      reservationsExpired: expired.length,
      ordersExpired: updatedOrders.count,
    };
  });
}
