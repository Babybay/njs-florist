"use server";

import { validateDeliverySlot } from "@/server/services/delivery.service";

export async function validateDeliverySlotAction(slotId: string, date: Date) {
  return validateDeliverySlot(slotId, date);
}
