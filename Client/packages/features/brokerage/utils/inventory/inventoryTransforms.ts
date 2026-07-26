/**
 * Period-scaled inventory listings for Market tab — same fixture pattern as
 * overviewTransforms / useBrokerageAnalytics (SIL-207).
 */
import type { InventoryListing } from "packages/features/brokerage/types/inventory";
import { periodScale, type TimePeriod } from "packages/features/brokerage/utils/analyticsPeriod";

import { INVENTORY_FIXTURE } from "./inventoryFixtures";

const BASE_LISTINGS = INVENTORY_FIXTURE.listings;

/** Cap map markers so year/all period repeats stay interactive. */
const MAX_PERIOD_LISTINGS = 360;

/**
 * Scale listing count by period (month = baseline). Week shows a subsample;
 * longer periods repeat the seed set with unique ids and slight pin offsets.
 */
export function buildBrokerageInventory(period: TimePeriod): InventoryListing[] {
  const scale = periodScale(period);
  if (scale < 1) {
    const take = Math.max(1, Math.round(BASE_LISTINGS.length * scale * 4));
    return BASE_LISTINGS.slice(0, Math.min(take, BASE_LISTINGS.length)).map((listing) => ({
      ...listing,
    }));
  }

  const repeats = Math.max(1, Math.round(scale));
  const out: InventoryListing[] = [];
  for (let r = 0; r < repeats; r++) {
    for (const listing of BASE_LISTINGS) {
      if (out.length >= MAX_PERIOD_LISTINGS) {
        return out;
      }
      const suffix = r === 0 ? "" : `-p${r}`;
      out.push({
        ...listing,
        id: `${listing.id}${suffix}`,
        external_id: `${listing.external_id}${suffix}`,
        lat: listing.lat + r * 0.008,
        lng: listing.lng + (r % 2 === 0 ? 0.006 : -0.006),
      });
    }
  }
  return out;
}
