/**
 * Atlanta-metro neighborhood price classes for Market map pins / KPIs.
 * Fixed bands keep the legend stable across portfolios.
 */
import type {
  InventoryColorMode,
  InventoryListing,
  InventoryListingStatus,
  InventoryPriceTier,
} from "packages/features/brokerage/types/inventory";

import { inventoryStatusToPinScore } from "./inventoryStatusPinScore";

/** Lower: < $300k */
export const PRICE_TIER_LOWER_MAX = 300_000;
/** Middle: $300k–$550k */
export const PRICE_TIER_MIDDLE_MAX = 550_000;
/** Upper: $550k–$900k */
export const PRICE_TIER_UPPER_MAX = 900_000;
/** Wealthy: ≥ $900k */

export const PRICE_TIER_ORDER: Exclude<InventoryPriceTier, "unknown">[] = [
  "lower",
  "middle",
  "upper",
  "wealthy",
];

export const PRICE_TIER_LABELS: Record<InventoryPriceTier, string> = {
  lower: "Lower-class",
  middle: "Middle-class",
  upper: "Upper-class",
  wealthy: "Wealthy",
  unknown: "Unknown",
};

export const PRICE_TIER_BAND_LABELS: Record<Exclude<InventoryPriceTier, "unknown">, string> = {
  lower: "< $300K",
  middle: "$300K–$550K",
  upper: "$550K–$900K",
  wealthy: "≥ $900K",
};

/**
 * Map listing price onto match-score pin tiers used by createScorePinElement.
 * wealthy → excellent, upper → strong, middle → fair, lower → poor.
 */
export function inventoryPriceTierToPinScore(tier: InventoryPriceTier): number {
  switch (tier) {
    case "wealthy":
      return 90;
    case "upper":
      return 75;
    case "middle":
      return 60;
    case "lower":
      return 30;
    default:
      return 0;
  }
}

export function priceToInventoryTier(price: number | null | undefined): InventoryPriceTier {
  if (price == null || !Number.isFinite(price)) return "unknown";
  if (price < PRICE_TIER_LOWER_MAX) return "lower";
  if (price < PRICE_TIER_MIDDLE_MAX) return "middle";
  if (price < PRICE_TIER_UPPER_MAX) return "upper";
  return "wealthy";
}

export function inventoryListingPinScore(
  listing: Pick<InventoryListing, "status" | "price">,
  colorMode: InventoryColorMode
): number {
  if (colorMode === "status") {
    return inventoryStatusToPinScore(listing.status);
  }
  return inventoryPriceTierToPinScore(priceToInventoryTier(listing.price));
}

export function statusLegendEntries(): {
  id: InventoryListingStatus;
  label: string;
  score: number;
}[] {
  return [
    { id: "active", label: "Active", score: inventoryStatusToPinScore("active") },
    { id: "pending", label: "Pending", score: inventoryStatusToPinScore("pending") },
    { id: "sold", label: "Sold", score: inventoryStatusToPinScore("sold") },
  ];
}

export function priceTierLegendEntries(): {
  id: Exclude<InventoryPriceTier, "unknown">;
  label: string;
  band: string;
  score: number;
}[] {
  return PRICE_TIER_ORDER.map((id) => ({
    id,
    label: PRICE_TIER_LABELS[id],
    band: PRICE_TIER_BAND_LABELS[id],
    score: inventoryPriceTierToPinScore(id),
  }));
}
