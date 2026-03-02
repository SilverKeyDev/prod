import type { SearchResult } from "packages/features/search/types/result";

/**
 * Heuristic score for map marker priority (price/beds/baths/sqft bands). Different from
 * getMatchScore used in SidebarList; weights and cap (100) are arbitrary. Do not use
 * for ranking vs. backend match score.
 */
export function calculatePropertyScore(property: SearchResult): number {
  let score = 0;
  if (property.price) {
    const price = typeof property.price === "string" ? parseFloat(property.price) : property.price;
    if (!isNaN(price)) {
      if (price < 300000) score += 30;
      else if (price < 500000) score += 20;
      else if (price < 750000) score += 10;
    }
  }
  if (property.bedrooms) {
    if (property.bedrooms >= 3) score += 20;
    else if (property.bedrooms >= 2) score += 10;
  }
  if (property.bathrooms) {
    if (property.bathrooms >= 2) score += 15;
    else if (property.bathrooms >= 1.5) score += 10;
  }
  if (property.sqft) {
    if (property.sqft >= 2000) score += 20;
    else if (property.sqft >= 1500) score += 15;
    else if (property.sqft >= 1000) score += 10;
  }
  return Math.min(score, 100);
}
