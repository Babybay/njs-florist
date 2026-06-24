import { db } from "@/lib/db";
import { clientKey, rateLimit, rateLimitResponse } from "@/lib/rate-limit";
import { createPaymentForOrder } from "@/server/services/payment.service";

export async function POST(request: Request) {
  const limit = await rateLimit(clientKey(request, "midtrans-create"), {
    limit: 10,
    windowMs: 60_000,
  });
  if (!limit.ok) return rateLimitResponse(limit);

  const body = await request.json();
  const orderNumber = String(body.orderNumber ?? "");
  if (!orderNumber) {
    return Response.json({ error: "orderNumber is required" }, { status: 400 });
  }

  const order = await db.order.findUnique({ where: { orderNumber } });
  if (!order) {
    return Response.json({ error: "Order not found" }, { status: 404 });
  }
  if (order.status !== "PENDING_PAYMENT") {
    return Response.json(
      { error: "Order is no longer awaiting payment." },
      { status: 409 },
    );
  }

  const payment = await createPaymentForOrder({
    id: order.id,
    orderNumber: order.orderNumber,
    total: order.total,
  });

  return Response.json(payment);
}
