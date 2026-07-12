/**
 * Brokerage Market inventory — period-scaled fixtures (same pattern as overview).
 */
import { useMemo, useState } from "react";

import { useQuery } from "@tanstack/react-query";

import type {
  InventoryClientFilters,
  InventoryColorMode,
  InventoryListing,
  InventoryStatusFilter,
} from "packages/features/brokerage/types/inventory";
import type { TimePeriod } from "packages/features/brokerage/utils/analyticsPeriod";
import {
  filterInventoryListings,
  uniquePropertyTypes,
} from "packages/features/brokerage/utils/inventory/filterInventoryListings";
import { buildBrokerageInventory } from "packages/features/brokerage/utils/inventory/inventoryTransforms";
import {
  computeMarketInventoryMetrics,
  type MarketInventoryMetrics,
} from "packages/features/brokerage/utils/inventory/marketInventoryMetrics";

import { useBrokerageOrgId } from "./useBrokerageOrgId";

export type { InventoryColorMode, InventoryListing, InventoryStatusFilter };

export { buildBrokerageInventory } from "packages/features/brokerage/utils/inventory/inventoryTransforms";

const DEFAULT_FILTERS: InventoryClientFilters = {
  status: "all",
  priceTier: "all",
  priceMin: null,
  priceMax: null,
  propertyType: null,
  agentQuery: "",
};

export function useBrokerageInventory(period: TimePeriod = "all") {
  const brokerageOrgId = useBrokerageOrgId();
  const [filters, setFilters] = useState<InventoryClientFilters>(DEFAULT_FILTERS);
  const [colorMode, setColorMode] = useState<InventoryColorMode>("status");

  const query = useQuery({
    queryKey: ["brokerage-analytics", "inventory", brokerageOrgId, period],
    queryFn: async () => buildBrokerageInventory(period),
    initialData: () => buildBrokerageInventory(period),
    staleTime: 60_000,
  });

  const rawListings = query.data;

  const listings = useMemo(
    () => filterInventoryListings(rawListings, filters),
    [rawListings, filters]
  );

  const metrics: MarketInventoryMetrics = useMemo(
    () => computeMarketInventoryMetrics(listings),
    [listings]
  );

  const propertyTypeOptions = useMemo(() => uniquePropertyTypes(rawListings), [rawListings]);

  const setStatusFilter = (status: InventoryStatusFilter) => {
    setFilters((prev) => ({ ...prev, status }));
  };

  const setPriceMin = (priceMin: number | null) => {
    setFilters((prev) => ({ ...prev, priceMin }));
  };

  const setPriceMax = (priceMax: number | null) => {
    setFilters((prev) => ({ ...prev, priceMax }));
  };

  const setPropertyType = (propertyType: string | null) => {
    setFilters((prev) => ({ ...prev, propertyType }));
  };

  const setAgentQuery = (agentQuery: string) => {
    setFilters((prev) => ({ ...prev, agentQuery }));
  };

  return {
    listings,
    rawListings,
    metrics,
    filters,
    statusFilter: filters.status,
    setStatusFilter,
    setPriceMin,
    setPriceMax,
    setPropertyType,
    setAgentQuery,
    propertyTypeOptions,
    colorMode,
    setColorMode,
    isLoading: query.isLoading && !query.data,
    error: query.error ?? null,
  };
}
