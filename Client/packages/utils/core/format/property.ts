/**
 * Shared property formatting utilities for use across features (e.g. compare, search).
 * Kept in packages/utils to avoid cross-feature imports.
 */

export { formatPropertyType } from "./property/propertyTypeFormatters";

/**
 * Formats a price for display (USD).
 */
export function formatPrice(price: string | number | undefined): string {
  if (price === null || price === undefined || price === "") return "Price not available";
  const numPrice = typeof price === "string" ? parseFloat(price.replace(/[^0-9.-]+/g, "")) : price;
  if (isNaN(numPrice)) return "Price not available";
  return new Intl.NumberFormat("en-US", {
    style: "currency",
    currency: "USD",
    minimumFractionDigits: 0,
    maximumFractionDigits: 0,
  }).format(numPrice);
}
