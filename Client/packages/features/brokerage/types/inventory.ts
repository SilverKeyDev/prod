/**
 * Hand-typed DTOs for GET /api/v1/brokerage/analytics/inventory
 * until OpenAPI covers brokerage analytics paths.
 */

export type InventoryListingStatus = "active" | "sold" | "pending";

export type InventoryStatusFilter = "all" | InventoryListingStatus;

export type InventoryListing = {
  id: string;
  external_id: string;
  address: string;
  status: InventoryListingStatus;
  price: number | null;
  lat: number;
  lng: number;
  agent_name: string | null;
  property_type: string | null;
};

export type InventorySummary = {
  active_count: number;
  sold_count: number;
  total_count: number;
  median_price: number | null;
};

export type BrokerageInventoryResponse = {
  success: boolean;
  brokerage_org_id: string;
  listings: InventoryListing[];
  summary: InventorySummary;
};

/** Pin color mode for the Market map. */
export type InventoryColorMode = "price_tier" | "status";

/** Client-derived neighborhood price class (Atlanta-metro bands). */
export type InventoryPriceTier = "lower" | "middle" | "upper" | "wealthy" | "unknown";

export type InventoryClientFilters = {
  status: InventoryStatusFilter;
  priceTier: InventoryPriceTier | "all";
  priceMin: number | null;
  priceMax: number | null;
  propertyType: string | null;
  agentQuery: string;
};
