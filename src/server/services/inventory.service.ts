import { cache } from "react";
import type { Prisma, PrismaClient } from "@prisma/client";
import { db } from "@/lib/db";
import {
  inventoryItemCreateSchema,
  inventoryItemUpdateSchema,
} from "@/server/validations/inventory.validation";
import { sendLowStockAlert } from "@/server/services/notification.service";

type AnyClient = PrismaClient | Prisma.TransactionClient;

export type StockMovementInput = {
  inventoryItemId: string;
  type: "IN" | "OUT" | "ADJUSTMENT" | "RESERVED" | "RELEASED";
  /** Positive magnitude; for ADJUSTMENT this is the target absolute quantity. */
  quantity: number;
  reason?: string;
  orderId?: string;
  createdById?: string;
};

/**
 * Apply a stock movement atomically: update currentQty, write a StockMovement row,
 * and trigger a low-stock alert when crossing the reorder threshold downward.
 *
 * Conventions:
 *   - IN:         currentQty += quantity. Movement row records quantity as positive magnitude.
 *   - OUT:        currentQty -= quantity. Throws if would go below 0.
 *   - ADJUSTMENT: currentQty := quantity (absolute set). Movement row records the delta magnitude.
 *   - RESERVED/RELEASED: bookkeeping only — does NOT change currentQty (reservations are tracked on StockReservation).
 */
export async function applyStockMovement(input: StockMovementInput, client: AnyClient = db) {
  const run = async (tx: AnyClient) => {
    const item = await tx.inventoryItem.findUnique({
      where: { id: input.inventoryItemId },
    });
    if (!item) throw new Error("Inventory item not found.");

    const prevQty = item.currentQty;
    let nextQty = prevQty;
    let recordedQuantity = input.quantity;

    if (input.type === "IN") {
      nextQty = prevQty + input.quantity;
    } else if (input.type === "OUT") {
      if (input.quantity > prevQty) {
        throw new Error(`Stok ${item.name} tidak cukup (tersisa ${prevQty}).`);
      }
      nextQty = prevQty - input.quantity;
    } else if (input.type === "ADJUSTMENT") {
      // quantity is the target absolute value; record the magnitude of the delta.
      nextQty = input.quantity;
      recordedQuantity = Math.abs(nextQty - prevQty);
    }

    if (nextQty !== prevQty) {
      await tx.inventoryItem.update({
        where: { id: input.inventoryItemId },
        data: { currentQty: nextQty },
      });
    }

    const movement = await tx.stockMovement.create({
      data: {
        inventoryItemId: input.inventoryItemId,
        type: input.type,
        quantity: recordedQuantity,
        reason: input.reason,
        orderId: input.orderId,
        createdById: input.createdById,
      },
    });

    return {
      movement,
      item: { ...item, currentQty: nextQty },
      prevQty,
      crossedReorderThreshold:
        prevQty > item.reorderLevel && nextQty <= item.reorderLevel && item.reorderLevel > 0,
    };
  };

  const result =
    "$transaction" in client
      ? await (client as PrismaClient).$transaction(async (tx) => run(tx))
      : await run(client);

  if (result.crossedReorderThreshold) {
    // Fire-and-forget: alert delivery must not break the order/checkout transaction caller.
    sendLowStockAlert({
      itemId: result.item.id,
      name: result.item.name,
      currentQty: result.item.currentQty,
      reorderLevel: result.item.reorderLevel,
      unit: result.item.unit,
    }).catch((err) => console.error("Low-stock alert failed", err));
  }

  return result;
}

export async function createInventoryItem(input: unknown) {
  const parsed = inventoryItemCreateSchema.parse(input);
  return db.inventoryItem.create({ data: parsed });
}

export async function updateInventoryItem(input: unknown) {
  const parsed = inventoryItemUpdateSchema.parse(input);
  const { id, ...rest } = parsed;
  return db.inventoryItem.update({ where: { id }, data: rest });
}

/**
 * Items at or below their reorder level. Raw SQL so the comparison is
 * column-vs-column (currentQty <= reorderLevel) and only matching rows are
 * fetched. Wrapped in React.cache to dedupe within a single request (e.g. the
 * dashboard stat + section). Single source of truth for "low stock".
 */
export const listLowStockItems = cache(async () => {
  return db.$queryRaw<
    Array<{
      id: string;
      name: string;
      unit: string;
      currentQty: number;
      reorderLevel: number;
    }>
  >`
    SELECT id, name, unit, "currentQty", "reorderLevel"
    FROM "InventoryItem"
    WHERE "reorderLevel" > 0 AND "currentQty" <= "reorderLevel"
    ORDER BY name ASC
  `;
});
