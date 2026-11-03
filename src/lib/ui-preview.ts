/**
 * Enables a database-free storefront preview for local design work only.
 * Production never opts into this flag.
 */
export const isUiPreview =
  process.env.NODE_ENV === "development" && process.env.UI_PREVIEW === "1";
