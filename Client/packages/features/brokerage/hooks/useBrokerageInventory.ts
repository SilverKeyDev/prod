import { useMemo, useState } from "react";

import {
  INVENTORY_FIXTURE,
  type InventoryListing,
} from "packages/features/brokerage/utils/inventory/inventoryFixtures";

export type InventoryStatusFilter = "all" | "active" | "sold" | "pending";

export function useBrokerageInventory(initialFilter: InventoryStatusFilter = "all") {
  const [statusFilter, setStatusFilter] = useState<InventoryStatusFilter>(initialFilter);

  const listings = useMemo(() => {
    if (statusFilter === "all") return INVENTORY_FIXTURE.listings;
    return INVENTORY_FIXTURE.listings.filter((l) => l.status === statusFilter);
  }, [statusFilter]);

  const summary = useMemo(() => {
    const active_count = listings.filter((l) => l.status === "active").length;
    const sold_count = listings.filter((l) => l.status === "sold").length;
    const prices = listings
      .map((l) => l.price)
      .filter((p): p is number => typeof p === "number")
      .sort((a, b) => a - b);
    return {
      active_count,
      sold_count,
      total_count: listings.length,
      median_price: prices.length ? prices[Math.floor(prices.length / 2)] : null,
    };
  }, [listings]);

  return {
    listings,
    summary,
    statusFilter,
    setStatusFilter,
    isLoading: false,
    error: null as string | null,
  };
}

export type { InventoryListing };
