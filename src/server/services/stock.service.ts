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

/**
 * Batched availability for many variants in a single query. Avoids the N+1
 * that comes from calling calculateVariantAvailability() per variant in a loop
 * (e.g. on the product detail page). Variants with no recipe map to 0.
 */
export async function calculateVariantAvailabilityMap(
  variantIds: string[],
): Promise<Map<string, number>> {
  const result = new Map<string, number>(variantIds.map((id) => [id, 0]));
  if (variantIds.length === 0) return result;

  const recipes = await db.variantRecipe.findMany({
    where: { variantId: { in: variantIds } },
    include: { inventoryItem: true },
  });

  const seen = new Set<string>();
  for (const recipe of recipes) {
    const possible = Math.floor(recipe.inventoryItem.currentQty / recipe.quantityNeeded);
    if (!seen.has(recipe.variantId)) {
      seen.add(recipe.variantId);
      result.set(recipe.variantId, possible);
    } else {
      result.set(recipe.variantId, Math.min(result.get(recipe.variantId)!, possible));
    }
  }

  return result;
}

export async function assertVariantStock(variantId: string, quantity: number) {
  const availableQty = await calculateVariantAvailability(variantId);
  if (availableQty < quantity) {
    throw new Error("Not enough stock available.");
  }
}
