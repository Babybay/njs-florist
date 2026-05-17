import { getSettingNumber, SETTING_KEYS } from "@/server/services/settings.service";

type PriceableCart = {
  items: Array<{
    quantity: number;
    variant: {
      priceAdjust: number;
      product: { basePrice: number };
    };
    addons: Array<{ quantity: number; addon: { price: number } }>;
  }>;
};

export async function getDeliveryFee(): Promise<number> {
  return getSettingNumber(SETTING_KEYS.DELIVERY_FEE);
}

export async function calculateCartPricing(
  cart: PriceableCart,
  discountAmount = 0,
  deliveryFee?: number,
) {
  const fee = deliveryFee ?? (await getDeliveryFee());
  const subtotal = cart.items.reduce((total, item) => {
    const variantTotal = (item.variant.product.basePrice + item.variant.priceAdjust) * item.quantity;
    const addonTotal = item.addons.reduce((addonSum, addon) => addonSum + addon.addon.price * addon.quantity, 0);
    return total + variantTotal + addonTotal;
  }, 0);

  return {
    subtotal,
    deliveryFee: fee,
    discountAmount,
    total: subtotal + fee - discountAmount,
  };
}
