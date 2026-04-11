/**
 * Normalize listing price from polygon/search API payloads.
 * Zillow-style props often use `unformattedPrice` or `listPrice` when `price` is absent.
 * Some responses use snake_case or JSON `null` on `price` while numeric lives in other keys.
 */
export type PropertySearchListingPriceSource = {
  price?: number | string | null;
  unformattedPrice?: number | null;
  listPrice?: number | string | null;
  unformatted_price?: number | null;
  list_price?: number | string | null;
  listing_price?: number | string | null;
};

function parseNumericPrice(value: unknown): number | undefined {
  if (value === null || value === undefined) {
    return undefined;
  }
  if (typeof value === "number" && Number.isFinite(value)) {
    return value;
  }
  if (typeof value === "string" && value.trim() !== "") {
    const n = parseFloat(value.replace(/[$,]/g, ""));
    return Number.isFinite(n) ? n : undefined;
  }
  return undefined;
}

/**
 * Returns a display string without a guaranteed `$` prefix (callers / UI add `$` when needed).
 */
export function formatPropertySearchListingPrice(
  property: PropertySearchListingPriceSource,
): string {
  const numeric =
    parseNumericPrice(property.unformattedPrice) ??
    parseNumericPrice(property.unformatted_price) ??
    parseNumericPrice(property.price) ??
    parseNumericPrice(property.listPrice) ??
    parseNumericPrice(property.list_price) ??
    parseNumericPrice(property.listing_price);

  if (numeric !== undefined) {
    return numeric.toLocaleString();
  }

  if (typeof property.price === "string" && property.price.trim() !== "") {
    return property.price.trim();
  }
  if (
    typeof property.listPrice === "string" &&
    property.listPrice.trim() !== ""
  ) {
    return property.listPrice.trim();
  }
  if (
    typeof property.list_price === "string" &&
    property.list_price.trim() !== ""
  ) {
    return property.list_price.trim();
  }
  if (
    typeof property.listing_price === "string" &&
    property.listing_price.trim() !== ""
  ) {
    return property.listing_price.trim();
  }

  return "Price not available";
}

/**
 * User-visible price for cards (includes `$` when showing an amount; no `$` on unavailable copy).
 */
export function displayListingPriceForCard(price: unknown): string {
  if (price === null || price === undefined) {
    return "Price not available";
  }
  if (typeof price === "number" && Number.isFinite(price)) {
    return `$${price.toLocaleString()}`;
  }
  if (typeof price === "string") {
    const t = price.trim();
    if (t === "" || t.toLowerCase() === "null") {
      return "Price not available";
    }
    if (t === "Price not available") {
      return t;
    }
    return t.startsWith("$") ? t : `$${t}`;
  }
  return "Price not available";
}
