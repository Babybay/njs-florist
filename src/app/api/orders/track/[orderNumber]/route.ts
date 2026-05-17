import { findOrderByNumber } from "@/server/services/order.service";

export async function GET(_request: Request, context: RouteContext<"/api/orders/track/[orderNumber]">) {
  const { orderNumber } = await context.params;
  const order = await findOrderByNumber(orderNumber);

  if (!order) {
    return Response.json({ error: "Order not found" }, { status: 404 });
  }

  return Response.json(order);
}
