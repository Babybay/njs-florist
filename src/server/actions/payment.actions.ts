"use server";

import { revalidatePath } from "next/cache";
import { syncOrderPaymentStatus } from "@/server/services/payment.service";

export async function syncPaymentStatusAction(formData: FormData) {
  const orderNumber = String(formData.get("orderNumber") ?? "").trim();
  if (!orderNumber) throw new Error("orderNumber missing.");

  const result = await syncOrderPaymentStatus(orderNumber);

  revalidatePath(`/admin/orders/${orderNumber}`);
  revalidatePath(`/account/orders/${orderNumber}`);
  revalidatePath(`/track/${orderNumber}`);

  return result;
}
