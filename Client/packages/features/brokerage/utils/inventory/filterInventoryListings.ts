import type {
  InventoryClientFilters,
  InventoryListing,
} from "packages/features/brokerage/types/inventory";
import { priceToInventoryTier } from "packages/features/brokerage/utils/inventory/inventoryPriceTier";

export function filterInventoryListings(
  listings: InventoryListing[],
  filters: InventoryClientFilters
): InventoryListing[] {
  const agentQ = filters.agentQuery.trim().toLowerCase();
  return listings.filter((listing) => {
    if (filters.status !== "all" && listing.status !== filters.status) return false;
    if (filters.priceTier !== "all") {
      if (priceToInventoryTier(listing.price) !== filters.priceTier) return false;
    }
    if (filters.priceMin != null && (listing.price == null || listing.price < filters.priceMin)) {
      return false;
    }
    if (filters.priceMax != null && (listing.price == null || listing.price > filters.priceMax)) {
      return false;
    }
    if (
      filters.propertyType != null &&
      filters.propertyType !== "" &&
      (listing.property_type ?? "") !== filters.propertyType
    ) {
      return false;
    }
    if (agentQ) {
      const name = (listing.agent_name ?? "").toLowerCase();
      if (!name.includes(agentQ)) return false;
    }
    return true;
  });
}

/** Distinct non-null property types for filter button options. */
export function uniquePropertyTypes(listings: InventoryListing[]): string[] {
  const set = new Set<string>();
  for (const listing of listings) {
    if (listing.property_type) set.add(listing.property_type);
  }
  return [...set].sort((a, b) => a.localeCompare(b));
}
