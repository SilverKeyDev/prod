/**
 * Shared property formatting utilities for use across features (e.g. compare, search).
 * Kept in packages/utils to avoid cross-feature imports.
 */

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

/**
 * Converts property type strings from various formats to readable text.
 * Handles: ALL_CAPS, underscores, dashes (e.g. "SINGLE_FAMILY" -> "Single Family").
 */
export function formatPropertyType(type?: string): string {
  if (!type || type.trim() === "") return "N/A";

  const normalized = type.replace(/[_-]/g, " ");

  return normalized
    .split(/\s+/)
    .filter((word) => word.length > 0)
    .map((word) => {
      if (word === word.toUpperCase() && word.length > 1) {
        return word.charAt(0) + word.slice(1).toLowerCase();
      }
      return word.charAt(0).toUpperCase() + word.slice(1).toLowerCase();
    })
    .join(" ");
}
