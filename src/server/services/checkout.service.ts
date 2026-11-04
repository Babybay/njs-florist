import { db } from "@/lib/db";
import { addMinutes, formatOrderNumber, witaDayRange } from "@/lib/utils";
import { checkoutInputSchema } from "@/server/validations/checkout.validation";
import { calculateCartPricing } from "@/server/services/pricing.service";
import { createPaymentForOrder } from "@/server/services/payment.service";
import { validateDeliverySlot } from "@/server/services/delivery.service";
import { resolveDiscountCode } from "@/server/services/discount.service";
import { sweepExpiredReservations } from "@/server/services/reservation.service";
import { getStore } from "@/server/services/store.service";
import { getSettingNumber, SETTING_KEYS } from "@/server/services/settings.service";
import { PICKUP_HOLD_MINUTES, pickupDateKey, parsePickupDate } from "@/lib/pickup-schedule";

export async function createCheckoutOrder(input: unknown) {
  const parsed = checkoutInputSchema.parse(input);

  // Lazy expiry: clean up stale PENDING_PAYMENT reservations before reading stock.
  await sweepExpiredReservations();

  // Load the cart before taking transaction locks; capacity is rechecked inside.
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

  const store = await getStore(parsed.storeId);
  if (!store || !store.isActive) {
    throw new Error("Toko pickup tidak valid. Silakan pilih toko lain.");
  }

  const cutoffHour = await getSettingNumber(SETTING_KEYS.SAME_DAY_CUTOFF_HOUR);
  const pickupDay = pickupDateKey(parsed.delivery.date);
  const needsPreparation = cart.items.some((item) => !item.variant.product.isSameDayEligible);
  function validatePreparationTime() {
    if (pickupDay === pickupDateKey() && needsPreparation) {
      throw new Error("Ada rangkaian yang perlu disiapkan lebih awal. Pilih jadwal pickup mulai besok.");
    }
  }
  validatePreparationTime();
  await validateDeliverySlot(parsed.delivery.slotId, parsed.delivery.date, parsed.storeId, { cutoffHour });

  const basePricing = await calculateCartPricing(cart);
  const discount = await resolveDiscountCode(parsed.discountCode, basePricing.subtotal);
  const pricing = await calculateCartPricing(cart, discount?.amount ?? 0, basePricing.deliveryFee);

  // Atomic write block: order, items, reservations, discount usage.
  const order = await db.$transaction(
    async (tx) => {
      // Transaction-scoped locks work with pooled Postgres connections. Recheck
      // capacity after acquiring the lock, so two buyers cannot take the last slot.
      await tx.$executeRaw`SELECT pg_advisory_xact_lock(hashtext(${`pickup:${parsed.delivery.slotId}:${pickupDay}`}))`;
      validatePreparationTime();
      await validateDeliverySlot(parsed.delivery.slotId, parsed.delivery.date, parsed.storeId, { client: tx, cutoffHour });
      // Daily-reset sequence: count orders already placed today (WITA), +1.
      const { start, end, y, m, d } = witaDayRange();
      await tx.$executeRaw`SELECT pg_advisory_xact_lock(hashtext(${`order-number:${y}-${m}-${d}`}))`;
      const todaysOrders = await tx.order.count({
        where: { createdAt: { gte: start, lt: end } },
      });
      const orderNumber = formatOrderNumber(y, m, d, todaysOrders + 1);

      const created = await tx.order.create({
        data: {
          orderNumber,
          userId: parsed.userId,
          storeId: parsed.storeId,
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
          deliveryDate: parsePickupDate(pickupDay),
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
              expiresAt: addMinutes(created.createdAt, PICKUP_HOLD_MINUTES),
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
