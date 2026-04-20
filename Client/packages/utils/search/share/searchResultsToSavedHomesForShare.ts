import type { SearchResult } from "packages/features/search/types/result";
import type { SavedHome } from "packages/types/domain/savedHome";

/**
 * Minimal `SavedHome` rows for `buildSharedHomesAttachmentMessage` from polygon search results.
 */
export function searchResultsToSavedHomesForShare(results: SearchResult[]): SavedHome[] {
  return results.map((p) => {
    const address = typeof p.address === "string" ? p.address.trim() : String(p.address ?? "");
    const lot = typeof p.lotSize === "string" && p.lotSize.trim() !== "" ? p.lotSize.trim() : "";
    const price = typeof p.price === "string" ? p.price : String(p.price ?? "");
    return {
      home_id: p.id,
      description: address,
      address,
      price,
      bedrooms: p.bedrooms,
      bathrooms: p.bathrooms,
      sqft: p.sqft,
      lot_size: lot,
      image_url: p.imageUrl,
      lat: p.lat,
      lng: p.lng,
    };
  });
}
