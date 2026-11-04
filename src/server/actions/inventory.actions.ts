"use server";

import { revalidatePath } from "next/cache";
import { requireAdmin } from "@/server/services/auth.service";
import {
  applyStockMovement,
  createInventoryItem,
  updateInventoryItem,
} from "@/server/services/inventory.service";
import { calculateVariantAvailability } from "@/server/services/stock.service";
import { stockMovementInputSchema } from "@/server/validations/inventory.validation";

export async function calculateVariantAvailabilityAction(variantId: string) {
  return calculateVariantAvailability(variantId);
}

function num(value: FormDataEntryValue | null) {
  if (value == null) return undefined;
  const parsed = Number(value);
  return Number.isFinite(parsed) ? parsed : undefined;
}

function trimOrUndefined(value: FormDataEntryValue | null) {
  const trimmed = String(value ?? "").trim();
  return trimmed.length > 0 ? trimmed : undefined;
}

export async function createInventoryItemAction(formData: FormData) {
  await requireAdmin();
  await createInventoryItem({
    name: String(formData.get("name") ?? "").trim(),
    unit: String(formData.get("unit") ?? "").trim(),
    sku: String(formData.get("sku") ?? "").trim(),
    currentQty: num(formData.get("currentQty")) ?? 0,
    reorderLevel: num(formData.get("reorderLevel")) ?? 0,
  });
  revalidatePath("/admin/inventory");
  revalidatePath("/admin");
}

export async function updateInventoryItemAction(formData: FormData) {
  await requireAdmin();
  await updateInventoryItem({
    id: String(formData.get("id") ?? ""),
    name: trimOrUndefined(formData.get("name")),
    unit: trimOrUndefined(formData.get("unit")),
    reorderLevel: num(formData.get("reorderLevel")),
  });
  revalidatePath("/admin/inventory");
  revalidatePath("/admin");
}

export async function applyStockMovementAction(formData: FormData) {
  const session = await requireAdmin();
  const inventoryItemId = String(formData.get("inventoryItemId") ?? "");
  const type = String(formData.get("type") ?? "") as "IN" | "OUT" | "ADJUSTMENT";
  const quantity = num(formData.get("quantity"));
  const reason = trimOrUndefined(formData.get("reason"));
  if (!inventoryItemId || !["IN", "OUT", "ADJUSTMENT"].includes(type)) throw new Error("Pilih bahan dan jenis perubahan stok yang valid.");
  const validation = stockMovementInputSchema.safeParse({ inventoryItemId, type, quantity, reason });
  if (!validation.success) throw new Error(validation.error.issues[0]?.message ?? "Periksa jumlah stok.");

  await applyStockMovement({
    inventoryItemId,
    type,
    quantity: validation.data.quantity,
    reason,
    createdById: session.id,
  });
  revalidatePath("/admin/inventory");
  revalidatePath("/admin/inventory/movements");
  revalidatePath("/admin");
}
