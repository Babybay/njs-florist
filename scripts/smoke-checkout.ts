import { PrismaClient } from "@prisma/client";
import { createCheckoutOrder } from "../src/server/services/checkout.service";
import { verifyMidtransSignature } from "../src/lib/midtrans";
import crypto from "node:crypto";

const db = new PrismaClient();

async function main() {
  console.log("start");
  const sessionId = "smoke-test-sid-" + Date.now();
  const cart = await db.cart.create({ data: { sessionId } });

  const variant = await db.productVariant.findFirst({ where: { sku: "ROSE-RED-M-PREM" } });
  if (!variant) throw new Error("seed missing variant");
  const card = await db.addon.findFirst({ where: { name: "Kartu Ucapan" } });
  if (!card) throw new Error("seed missing addon");

  await db.cartItem.create({
    data: {
      cartId: cart.id,
      productId: variant.productId,
      variantId: variant.id,
      quantity: 1,
      cardMessage: "Test smoke",
      addons: { create: [{ addonId: card.id, quantity: 1 }] },
    },
  });

  const slot = await db.deliverySlot.findFirst({ where: { isActive: true } });
  if (!slot) throw new Error("seed missing slot");

  const futureDate = new Date(Date.now() + 2 * 24 * 60 * 60 * 1000);
  const result = await createCheckoutOrder({
    cartId: cart.id,
    recipient: {
      name: "Smoke Recipient",
      phone: "+628111111",
      senderName: "Smoke Sender",
      isAnonymous: false,
      cardMessage: "Test",
    },
    delivery: { date: futureDate, slotId: slot.id, address: "Jl Test 1, Bali", notes: "lt 1" },
  });

  const reservationCount = await db.stockReservation.count({ where: { orderId: result.order.id } });
  const orderItemAddons = await db.orderItemAddon.count({
    where: { orderItem: { orderId: result.order.id } },
  });

  console.log(
    JSON.stringify(
      {
        orderNumber: result.order.orderNumber,
        status: result.order.status,
        subtotal: result.order.subtotal,
        deliveryFee: result.order.deliveryFee,
        total: result.order.total,
        reservations: reservationCount,
        orderItemAddons,
        snapToken: result.payment.token,
        snapRedirectUrl: result.payment.redirectUrl,
      },
      null,
      2,
    ),
  );

  // Webhook signature sanity check.
  const serverKey = process.env.MIDTRANS_SERVER_KEY ?? "";
  const orderId = result.order.orderNumber;
  const statusCode = "200";
  const grossAmount = `${result.order.total}.00`;
  const signature = crypto
    .createHash("sha512")
    .update(`${orderId}${statusCode}${grossAmount}${serverKey}`)
    .digest("hex");
  const verified = verifyMidtransSignature({
    order_id: orderId,
    status_code: statusCode,
    gross_amount: grossAmount,
    signature_key: signature,
  });
  console.log(JSON.stringify({ webhookSignatureVerified: verified }, null, 2));

  // cleanup
  await db.stockReservation.deleteMany({ where: { orderId: result.order.id } });
  await db.orderItemAddon.deleteMany({ where: { orderItem: { orderId: result.order.id } } });
  await db.orderItem.deleteMany({ where: { orderId: result.order.id } });
  await db.payment.deleteMany({ where: { orderId: result.order.id } });
  await db.order.delete({ where: { id: result.order.id } });
  await db.cartItemAddon.deleteMany({ where: { cartItem: { cartId: cart.id } } });
  await db.cartItem.deleteMany({ where: { cartId: cart.id } });
  await db.cart.delete({ where: { id: cart.id } });
}

main()
  .catch((err) => {
    console.error("ERR", err);
    process.exit(1);
  })
  .finally(() => db.$disconnect());
