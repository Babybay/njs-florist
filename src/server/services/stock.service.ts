import { db } from "@/lib/db";

export async function calculateVariantAvailability(variantId: string) {
  const recipes = await db.variantRecipe.findMany({
    where: { variantId },
    include: { inventoryItem: true },
  });

  if (recipes.length === 0) return 0;

  const availability = recipes.map((recipe) =>
    Math.floor(recipe.inventoryItem.currentQty / recipe.quantityNeeded),
  );

  return Math.min(...availability);
}

export async function assertVariantStock(variantId: string, quantity: number) {
  const availableQty = await calculateVariantAvailability(variantId);
  if (availableQty < quantity) {
    throw new Error("Not enough stock available.");
  }
}
