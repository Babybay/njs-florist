import { db } from "@/lib/db";
import { addToCartInputSchema } from "@/server/validations/cart.validation";
import { assertVariantStock } from "@/server/services/stock.service";

const CART_INCLUDE = {
  items: {
    include: {
      variant: {
        include: {
          product: { include: { images: { orderBy: { sortOrder: "asc" } } } },
        },
      },
      addons: { include: { addon: true } },
    },
    orderBy: { id: "asc" },
  },
} as const;

export type CartWithItems = NonNullable<Awaited<ReturnType<typeof loadCart>>>;

export async function getOrCreateCart(userId?: string, sessionId?: string) {
  if (!userId && !sessionId) {
    throw new Error("Cart needs a userId or sessionId.");
  }

  const existing = await db.cart.findFirst({
    where: userId ? { userId } : { sessionId },
  });
  if (existing) return existing;

  return db.cart.create({
    data: { userId, sessionId },
  });
}

export async function loadCart({
  userId,
  sessionId,
}: {
  userId?: string;
  sessionId?: string;
}) {
  if (!userId && !sessionId) return null;
  return db.cart.findFirst({
    where: userId ? { userId } : { sessionId },
    include: CART_INCLUDE,
  });
}

export async function addToCart(input: unknown) {
  const parsed = addToCartInputSchema.parse(input);
  await assertVariantStock(parsed.variantId, parsed.quantity);
  const cart = await getOrCreateCart(parsed.userId, parsed.sessionId);

  const item = await db.cartItem.create({
    data: {
      cartId: cart.id,
      productId: parsed.productId,
      variantId: parsed.variantId,
      quantity: parsed.quantity,
      cardMessage: parsed.cardMessage,
      addons: {
        create: parsed.addons.map((addon) => ({
          addonId: addon.addonId,
          quantity: addon.quantity,
        })),
      },
    },
  });

  // Cart was just touched — clear the abandoned flag so a future inactivity period re-triggers.
  await db.cart.update({
    where: { id: cart.id },
    data: { abandonedReminderSentAt: null },
  });

  return item;
}

export async function removeCartItem(itemId: string, cartId: string) {
  return db.$transaction(async (tx) => {
    const item = await tx.cartItem.findUnique({ where: { id: itemId } });
    if (!item || item.cartId !== cartId) {
      throw new Error("Cart item not found.");
    }
    await tx.cartItemAddon.deleteMany({ where: { cartItemId: itemId } });
    return tx.cartItem.delete({ where: { id: itemId } });
  });
}

export async function updateCartItemQuantity(
  itemId: string,
  cartId: string,
  quantity: number,
) {
  if (quantity < 1) {
    return removeCartItem(itemId, cartId);
  }
  const item = await db.cartItem.findUnique({ where: { id: itemId } });
  if (!item || item.cartId !== cartId) {
    throw new Error("Cart item not found.");
  }
  await assertVariantStock(item.variantId, quantity);
  return db.cartItem.update({
    where: { id: itemId },
    data: { quantity },
  });
}
