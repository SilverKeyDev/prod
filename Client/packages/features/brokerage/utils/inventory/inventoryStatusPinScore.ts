import type { InventoryListing } from "packages/features/brokerage/utils/inventory/inventoryFixtures";

/**
 * Map inventory listing status onto match-score pin tiers used by createScorePinElement.
 * active → excellent, pending → fair, sold → poor.
 */
export function inventoryStatusToPinScore(status: InventoryListing["status"]): number {
  switch (status) {
    case "active":
      return 90;
    case "pending":
      return 60;
    case "sold":
      return 30;
    default:
      return 0;
  }
}
