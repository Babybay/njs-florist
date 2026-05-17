"use server";

import { redirect } from "next/navigation";
import { readCartSessionId } from "@/lib/cart-session";
import { getCurrentUser } from "@/lib/auth";
import { loadCart } from "@/server/services/cart.service";
import { createCheckoutOrder } from "@/server/services/checkout.service";

export type CheckoutFormState = {
  error?: string;
};

export async function submitCheckoutAction(
  _previousState: CheckoutFormState,
  formData: FormData,
): Promise<CheckoutFormState> {
  const sessionId = await readCartSessionId();
  if (!sessionId) return { error: "Keranjang tidak ditemukan." };

  const cart = await loadCart({ sessionId });
  if (!cart || cart.items.length === 0) {
    return { error: "Keranjang masih kosong." };
  }

  const recipientName = String(formData.get("recipientName") ?? "").trim();
  const recipientPhone = String(formData.get("recipientPhone") ?? "").trim();
  const senderName = String(formData.get("senderName") ?? "").trim();
  const isAnonymous = formData.get("isAnonymous") === "on";
  const cardMessage = String(formData.get("cardMessage") ?? "").trim() || undefined;
  const notes = String(formData.get("notes") ?? "").trim() || undefined;
  const deliveryDateRaw = String(formData.get("deliveryDate") ?? "");
  const slotId = String(formData.get("slotId") ?? "");
  const discountCode = String(formData.get("discountCode") ?? "").trim() || undefined;

  if (!recipientName || !recipientPhone || !senderName || !deliveryDateRaw || !slotId) {
    return { error: "Mohon lengkapi semua field wajib." };
  }

  const deliveryDate = new Date(`${deliveryDateRaw}T09:00:00`);
  if (Number.isNaN(deliveryDate.getTime())) {
    return { error: "Tanggal pickup tidak valid." };
  }

  const sessionUser = await getCurrentUser();

  let result: Awaited<ReturnType<typeof createCheckoutOrder>>;
  try {
    result = await createCheckoutOrder({
      cartId: cart.id,
      userId: sessionUser?.id,
      recipient: { name: recipientName, phone: recipientPhone, senderName, isAnonymous, cardMessage },
      delivery: { date: deliveryDate, slotId, address: "", notes },
      discountCode,
    });
  } catch (error) {
    return { error: error instanceof Error ? error.message : "Checkout gagal." };
  }

  redirect(`/payment/pending?order=${encodeURIComponent(result.order.orderNumber)}`);
}

export async function createCheckoutOrderAction(input: unknown) {
  return createCheckoutOrder(input);
}
