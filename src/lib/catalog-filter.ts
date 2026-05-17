import type { StoreProduct } from "@/server/services/catalog.service";

export type CatalogSort = "new" | "price-asc" | "price-desc";

export type ParsedCatalogParams = {
  q: string;
  sort: CatalogSort;
  min: string;
  max: string;
  minNum: number | null;
  maxNum: number | null;
};

export function parseCatalogParams(raw: {
  q?: string | string[];
  sort?: string | string[];
  min?: string | string[];
  max?: string | string[];
}): ParsedCatalogParams {
  const first = (v: string | string[] | undefined) => (Array.isArray(v) ? v[0] : v) ?? "";
  const q = first(raw.q).trim();
  const sortRaw = first(raw.sort).trim();
  const sort: CatalogSort =
    sortRaw === "price-asc" || sortRaw === "price-desc" ? sortRaw : "new";
  const min = first(raw.min).trim();
  const max = first(raw.max).trim();
  const minNum = min ? Number(min) : null;
  const maxNum = max ? Number(max) : null;
  return {
    q,
    sort,
    min,
    max,
    minNum: Number.isFinite(minNum as number) ? (minNum as number) : null,
    maxNum: Number.isFinite(maxNum as number) ? (maxNum as number) : null,
  };
}

function lowestPriceOf(product: StoreProduct): number {
  const adjust = product.variants.length
    ? Math.min(...product.variants.map((v) => v.priceAdjust))
    : 0;
  return product.basePrice + adjust;
}

export function applyCatalogFilters(
  products: StoreProduct[],
  params: ParsedCatalogParams,
): StoreProduct[] {
  const query = params.q.toLowerCase();
  const filtered = products.filter((p) => {
    if (query) {
      const haystack = `${p.name} ${p.description} ${p.category.name}`.toLowerCase();
      if (!haystack.includes(query)) return false;
    }
    const price = lowestPriceOf(p);
    if (params.minNum !== null && price < params.minNum) return false;
    if (params.maxNum !== null && price > params.maxNum) return false;
    return true;
  });

  if (params.sort === "price-asc") {
    filtered.sort((a, b) => lowestPriceOf(a) - lowestPriceOf(b));
  } else if (params.sort === "price-desc") {
    filtered.sort((a, b) => lowestPriceOf(b) - lowestPriceOf(a));
  }
  // "new" keeps the catalog service's default createdAt desc order.

  return filtered;
}
