import { db } from "@/lib/db";
import { addMinutes, formatOrderNumber, witaDayRange } from "@/lib/utils";
import { checkoutInputSchema } from "@/server/validations/checkout.validation";
import { calculateCartPricing } from "@/server/services/pricing.service";
import { createPaymentForOrder } from "@/server/services/payment.service";
import { validateDeliverySlot } from "@/server/services/delivery.service";
import { resolveDiscountCode } from "@/server/services/discount.service";
import { sweepExpiredReservations } from "@/server/services/reservation.service";

export async function createCheckoutOrder(input: unknown) {
  const parsed = checkoutInputSchema.parse(input);

  // Lazy expiry: clean up stale PENDING_PAYMENT reservations before reading stock.
  await sweepExpiredReservations();

  // Reads happen outside the transaction so it stays under the 5s window.
  const cart = await db.cart.findUnique({
    where: { id: parsed.cartId },
    include: {
      items: {
        include: {
          variant: {
            include: {
              product: true,
              recipes: { include: { inventoryItem: true } },
            },
          },
          addons: { include: { addon: true } },
        },
      },
    },
  });
  if (!cart || cart.items.length === 0) {
    throw new Error("Cart is empty.");
  }

  await validateDeliverySlot(parsed.delivery.slotId, parsed.delivery.date);

  const basePricing = await calculateCartPricing(cart);
  const discount = await resolveDiscountCode(parsed.discountCode, basePricing.subtotal);
  const pricing = await calculateCartPricing(cart, discount?.amount ?? 0, basePricing.deliveryFee);

  // Atomic write block: order, items, reservations, discount usage.
  const order = await db.$transaction(
    async (tx) => {
      // Daily-reset sequence: count orders already placed today (WITA), +1.
      const { start, end, y, m, d } = witaDayRange();
      const todaysOrders = await tx.order.count({
        where: { createdAt: { gte: start, lt: end } },
      });
      const orderNumber = formatOrderNumber(y, m, d, todaysOrders + 1);

      const created = await tx.order.create({
        data: {
          orderNumber,
          userId: parsed.userId,
          status: "PENDING_PAYMENT",
          subtotal: pricing.subtotal,
          deliveryFee: pricing.deliveryFee,
          discountAmount: pricing.discountAmount,
          total: pricing.total,
          recipientName: parsed.recipient.name,
          recipientPhone: parsed.recipient.phone,
          senderName: parsed.recipient.senderName,
          isAnonymous: parsed.recipient.isAnonymous,
          cardMessage: parsed.recipient.cardMessage,
          deliveryDate: parsed.delivery.date,
          deliverySlotId: parsed.delivery.slotId,
          deliveryAddress: parsed.delivery.address,
          deliveryNotes: parsed.delivery.notes,
        },
      });

      for (const item of cart.items) {
        const unitPrice = item.variant.product.basePrice + item.variant.priceAdjust;
        const orderItem = await tx.orderItem.create({
          data: {
            orderId: created.id,
            productId: item.productId,
            variantId: item.variantId,
            productName: item.variant.product.name,
            variantName: item.variant.name,
            unitPrice,
            quantity: item.quantity,
            totalPrice: unitPrice * item.quantity,
          },
        });

        for (const cartAddon of item.addons) {
          await tx.orderItemAddon.create({
            data: {
              orderItemId: orderItem.id,
              addonId: cartAddon.addonId,
              addonName: cartAddon.addon.name,
              unitPrice: cartAddon.addon.price,
              quantity: cartAddon.quantity,
              totalPrice: cartAddon.addon.price * cartAddon.quantity,
            },
          });
        }

        for (const recipe of item.variant.recipes) {
          const requiredQty = recipe.quantityNeeded * item.quantity;
          // Re-read currentQty inside the tx so concurrent checkouts see the latest value.
          const fresh = await tx.inventoryItem.findUnique({
            where: { id: recipe.inventoryItemId },
            select: { currentQty: true, name: true },
          });
          if (!fresh || fresh.currentQty < requiredQty) {
            throw new Error(`Insufficient stock for ${recipe.inventoryItem.name}`);
          }
          await tx.stockReservation.create({
            data: {
              orderId: created.id,
              inventoryItemId: recipe.inventoryItemId,
              quantity: requiredQty,
              status: "ACTIVE",
              expiresAt: addMinutes(new Date(), 15),
            },
          });
        }
      }

      if (discount) {
        await tx.discountCode.update({
          where: { id: discount.id },
          data: { usedCount: { increment: 1 } },
        });
      }

      await tx.orderStatusHistory.create({
        data: {
          orderId: created.id,
          fromStatus: null,
          toStatus: "PENDING_PAYMENT",
          note: "Order created",
        },
      });

      return created;
    },
    { timeout: 30000, maxWait: 5000 },
  );

  // External payment-provider call happens after the DB transaction commits.
  const payment = await createPaymentForOrder(order);
  await db.payment.create({
    data: {
      orderId: order.id,
      provider: "MIDTRANS",
      providerOrderId: payment.providerOrderId,
      providerToken: payment.token,
      redirectUrl: payment.redirectUrl,
      amount: order.total,
      status: "PENDING",
    },
  });

  return { order, payment, discount };
}
