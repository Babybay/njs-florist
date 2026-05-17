import { PrismaClient } from "@prisma/client";
import { applyStockMovement, createInventoryItem } from "../src/server/services/inventory.service";

const db = new PrismaClient();

async function main() {
  const sku = `SMOKE-INV-${Date.now()}`;
  const item = await createInventoryItem({
    name: "Smoke Filler",
    unit: "pcs",
    sku,
    currentQty: 20,
    reorderLevel: 10,
  });

  // IN: +5  → 25
  const inResult = await applyStockMovement({
    inventoryItemId: item.id,
    type: "IN",
    quantity: 5,
    reason: "supplier receipt",
  });

  // OUT: -10 → 15 (still above reorder 10, no alert)
  const outResult1 = await applyStockMovement({
    inventoryItemId: item.id,
    type: "OUT",
    quantity: 10,
    reason: "spoilage",
  });

  // OUT: -8 → 7 (crosses reorder threshold downward)
  const outResult2 = await applyStockMovement({
    inventoryItemId: item.id,
    type: "OUT",
    quantity: 8,
    reason: "more spoilage",
  });

  // ADJUSTMENT: set to 50 (above threshold; no alert downcross)
  const adjResult = await applyStockMovement({
    inventoryItemId: item.id,
    type: "ADJUSTMENT",
    quantity: 50,
    reason: "stock opname",
  });

  // OUT-too-much: should throw
  let oversold = false;
  try {
    await applyStockMovement({
      inventoryItemId: item.id,
      type: "OUT",
      quantity: 9999,
    });
  } catch {
    oversold = true;
  }

  const movements = await db.stockMovement.count({ where: { inventoryItemId: item.id } });
  const finalItem = await db.inventoryItem.findUnique({ where: { id: item.id } });

  console.log(
    JSON.stringify(
      {
        afterIN: inResult.item.currentQty,
        afterFirstOUT: outResult1.item.currentQty,
        afterFirstOUTCrossed: outResult1.crossedReorderThreshold,
        afterSecondOUT: outResult2.item.currentQty,
        afterSecondOUTCrossed: outResult2.crossedReorderThreshold,
        afterADJUSTMENT: adjResult.item.currentQty,
        oversoldThrew: oversold,
        movements,
        finalCurrentQty: finalItem?.currentQty,
      },
      null,
      2,
    ),
  );

  // cleanup
  await db.stockMovement.deleteMany({ where: { inventoryItemId: item.id } });
  await db.inventoryItem.delete({ where: { id: item.id } });
}

main()
  .catch((e) => {
    console.error("ERR", e);
    process.exit(1);
  })
  .finally(() => db.$disconnect());
