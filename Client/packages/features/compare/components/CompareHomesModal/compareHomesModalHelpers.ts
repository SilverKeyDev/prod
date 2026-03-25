import type { CompareHomesPropertyDetails } from "packages/features/compare/types/compareHomes";
import type { SavedHome } from "packages/types";

/**
 * Build minimal CompareHomesPropertyDetails from a SavedHome when full details
 * are not yet loaded (e.g. before streamCompare completes).
 */
export function fallbackComparisonDetails(home: SavedHome): CompareHomesPropertyDetails {
  const homeId =
    "home_id" in home && typeof (home as { home_id?: string }).home_id === "string"
      ? (home as { home_id: string }).home_id
      : String(home.address ?? home.description ?? "");
  const address = String(home.address ?? home.description ?? "");
  const price =
    typeof home.price === "string"
      ? home.price.startsWith("$")
        ? home.price
        : `$${home.price}`
      : typeof home.price === "number"
        ? `$${home.price.toLocaleString()}`
        : undefined;
  return {
    id: homeId,
    address,
    price,
    bedrooms: home.bedrooms,
    bathrooms: home.bathrooms,
    sqft: home.sqft,
    lotSize:
      "lot_size" in home && typeof (home as { lot_size?: string }).lot_size === "string"
        ? (home as { lot_size: string }).lot_size
        : undefined,
    imageUrl: home.image_url,
  };
}
