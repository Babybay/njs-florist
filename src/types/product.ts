export type ProductStatus = "DRAFT" | "ACTIVE" | "ARCHIVED";

export type ProductVariantSelection = {
  productId: string;
  variantId: string;
  quantity: number;
  addonIds: string[];
  cardMessage?: string;
};
