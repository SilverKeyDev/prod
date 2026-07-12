import type {
  InventoryListing,
  InventoryPriceTier,
} from "packages/features/brokerage/types/inventory";

import { PRICE_TIER_LABELS, PRICE_TIER_ORDER, priceToInventoryTier } from "./inventoryPriceTier";

export type PropertyTypeMixItem = {
  type: string;
  count: number;
  percent: number;
};

export type PriceTierBreakdownItem = {
  tier: Exclude<InventoryPriceTier, "unknown">;
  label: string;
  count: number;
  percent: number;
};

export type MarketInventoryMetrics = {
  total_count: number;
  active_count: number;
  pending_count: number;
  sold_count: number;
  average_price: number | null;
  median_price: number | null;
  min_price: number | null;
  max_price: number | null;
  tier_breakdown: PriceTierBreakdownItem[];
  unknown_tier_count: number;
  property_type_mix: PropertyTypeMixItem[];
};

function sortedPrices(listings: InventoryListing[]): number[] {
  return listings
    .map((l) => l.price)
    .filter((p): p is number => typeof p === "number" && Number.isFinite(p))
    .sort((a, b) => a - b);
}

function medianOf(prices: number[]): number | null {
  if (prices.length === 0) return null;
  const mid = Math.floor(prices.length / 2);
  if (prices.length % 2 === 0) {
    return (prices[mid - 1]! + prices[mid]!) / 2;
  }
  return prices[mid]!;
}

/**
 * Portfolio analytics for the Market map header from filtered listings.
 */
export function computeMarketInventoryMetrics(
  listings: InventoryListing[]
): MarketInventoryMetrics {
  const prices = sortedPrices(listings);
  const sum = prices.reduce((acc, p) => acc + p, 0);

  const tierCounts: Record<InventoryPriceTier, number> = {
    lower: 0,
    middle: 0,
    upper: 0,
    wealthy: 0,
    unknown: 0,
  };
  for (const listing of listings) {
    tierCounts[priceToInventoryTier(listing.price)] += 1;
  }

  const typedTotal = listings.length || 1;
  const tier_breakdown = PRICE_TIER_ORDER.map((tier) => ({
    tier,
    label: PRICE_TIER_LABELS[tier],
    count: tierCounts[tier],
    percent: Math.round((tierCounts[tier] / typedTotal) * 100),
  }));

  const typeCounts = new Map<string, number>();
  for (const listing of listings) {
    const key = listing.property_type?.trim() || "Unknown";
    typeCounts.set(key, (typeCounts.get(key) ?? 0) + 1);
  }
  const property_type_mix: PropertyTypeMixItem[] = [...typeCounts.entries()]
    .map(([type, count]) => ({
      type,
      count,
      percent: Math.round((count / typedTotal) * 100),
    }))
    .sort((a, b) => b.count - a.count || a.type.localeCompare(b.type));

  return {
    total_count: listings.length,
    active_count: listings.filter((l) => l.status === "active").length,
    pending_count: listings.filter((l) => l.status === "pending").length,
    sold_count: listings.filter((l) => l.status === "sold").length,
    average_price: prices.length ? sum / prices.length : null,
    median_price: medianOf(prices),
    min_price: prices.length ? prices[0]! : null,
    max_price: prices.length ? prices[prices.length - 1]! : null,
    tier_breakdown,
    unknown_tier_count: tierCounts.unknown,
    property_type_mix,
  };
}
