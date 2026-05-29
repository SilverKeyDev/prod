import { useMemo } from "react";

import { formatPriceRange } from "packages/features/search/types/search/filters/searchFilterSummaries";

/** Open-ended range upper bound (UI sentinel for "8+"). */
const RANGE_OPEN_MAX = 8;

function formatBedBathRangeForScreen(
  minRaw: number | undefined,
  maxRaw: number | undefined,
  unit: "beds" | "baths"
): string {
  const minVal = typeof minRaw === "number" ? minRaw : 0;
  const hasExplicitMax = typeof maxRaw === "number";
  const minPositive = minVal > 0;
  const isWideOpenMin = minVal <= 0;
  const isWideOpenMax = !hasExplicitMax || maxRaw === RANGE_OPEN_MAX;

  if (isWideOpenMin && isWideOpenMax) {
    return "";
  }

  if (hasExplicitMax) {
    const max = maxRaw as number;
    if (max === RANGE_OPEN_MAX) {
      if (!minPositive) {
        return "";
      }
      return `${minVal} – ${RANGE_OPEN_MAX}+ ${unit}`;
    }
    if (!minPositive) {
      return `Any – ${max} ${unit}`;
    }
    return `${minVal} – ${max} ${unit}`;
  }

  return `${minVal}+ ${unit}`;
}

export function useSearchScreenCriteriaSummary(
  userPreferences: Record<string, unknown> | null | undefined
): string {
  return useMemo(() => {
    if (!userPreferences) return "";
    const minPrice = (userPreferences.home_budget_min as number | undefined) ?? 100000;
    const maxPrice = (userPreferences.home_budget_max as number | undefined) ?? 2000000;
    const minBeds = userPreferences.preferred_bedrooms_min as number | undefined;
    const maxBeds = userPreferences.preferred_bedrooms_max as number | undefined;
    const minBaths = userPreferences.preferred_bathrooms_min as number | undefined;
    const maxBaths = userPreferences.preferred_bathrooms_max as number | undefined;
    const priceSummary = formatPriceRange(minPrice, maxPrice);
    const bedPart = formatBedBathRangeForScreen(minBeds, maxBeds, "beds");
    const bathPart = formatBedBathRangeForScreen(minBaths, maxBaths, "baths");
    const bedBathSummary = [bedPart, bathPart].filter(Boolean).join(" · ");
    const locations = userPreferences.important_locations as
      | Array<{ address?: string }>
      | undefined
      | null;
    const locationsList = Array.isArray(locations) ? locations : [];
    const firstAddress = locationsList[0]?.address?.trim() ?? "";
    const locationLabel =
      firstAddress.length > 18 ? `${firstAddress.slice(0, 15)}...` : firstAddress || "";
    const parts = [priceSummary, locationLabel, bedBathSummary].filter(Boolean);
    return parts.join(" · ");
  }, [userPreferences]);
}
