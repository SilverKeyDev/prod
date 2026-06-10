import React, { useCallback } from "react";

import { useLocalization } from "packages/contexts";
import { useSearchDisplaySettings } from "packages/features/search/hooks/data/useSearchDisplaySettings";
import { useFiltersStore } from "packages/features/search/store/filters.slice";
import {
  isResultsOrderBy,
  isResultsSortDirection,
  RESULTS_ORDER_BY_OPTIONS,
  type ResultsOrderBy,
  type ResultsSortDirection,
} from "packages/features/search/types/domain/searchDisplay";
import { SEARCH_TRANSLATIONS } from "packages/features/search/types/domain/translations";
import { useAuthStore } from "packages/store";
import { Box } from "packages/ui/components/structure/primitives";

import { BodyText, Dropdown, OliveCheckbox, Subtitle } from "@/components/ui";

const ORDER_LABELS: Record<ResultsOrderBy, string> = {
  match_score: SEARCH_TRANSLATIONS["search.order_match_score"] ?? "Match score",
  price: SEARCH_TRANSLATIONS["search.order_price"] ?? "Price",
  distance: SEARCH_TRANSLATIONS["search.order_distance"] ?? "Distance",
  bedrooms: SEARCH_TRANSLATIONS["search.order_bedrooms"] ?? "Bedrooms",
  bathrooms: SEARCH_TRANSLATIONS["search.order_bathrooms"] ?? "Bathrooms",
  lot_size: SEARCH_TRANSLATIONS["search.order_lot_size"] ?? "Lot size",
  home_age: SEARCH_TRANSLATIONS["search.order_home_age"] ?? "Home age",
};

export type SearchDisplayPanelWebProps = {
  registerOutsideClickSafeTarget?: (element: HTMLElement) => () => void;
  menuPortalStack?: "page" | "modal";
};

export function SearchDisplayPanelWeb({
  registerOutsideClickSafeTarget,
  menuPortalStack = "page",
}: SearchDisplayPanelWebProps): React.ReactElement {
  const { t } = useLocalization();
  const authReady = useAuthStore((s) => s.authReady);
  const { patchSearchDisplay } = useSearchDisplaySettings(authReady);

  const showCommuteOverlay = useFiltersStore((s) => s.showCommuteOverlay);
  const setShowCommuteOverlay = useFiltersStore((s) => s.setShowCommuteOverlay);
  const resultsOrderBy = useFiltersStore((s) => s.resultsOrderBy);
  const setResultsOrderBy = useFiltersStore((s) => s.setResultsOrderBy);
  const resultsSortDirection = useFiltersStore((s) => s.resultsSortDirection);
  const setResultsSortDirection = useFiltersStore((s) => s.setResultsSortDirection);
  const handleCommute = useCallback(
    (checked: boolean) => {
      setShowCommuteOverlay(checked);
      patchSearchDisplay({ show_commute_overlay: checked });
    },
    [setShowCommuteOverlay, patchSearchDisplay]
  );

  const handleOrder = useCallback(
    (v: ResultsOrderBy) => {
      if (!isResultsOrderBy(v)) return;
      setResultsOrderBy(v);
      patchSearchDisplay({ results_order_by: v });
    },
    [setResultsOrderBy, patchSearchDisplay]
  );

  const handleSortDirection = useCallback(
    (v: ResultsSortDirection) => {
      if (!isResultsSortDirection(v)) return;
      setResultsSortDirection(v);
    },
    [setResultsSortDirection]
  );

  const orderOptions = RESULTS_ORDER_BY_OPTIONS.map((value) => ({
    value,
    label: ORDER_LABELS[value],
  }));

  const directionOptions: { value: ResultsSortDirection; label: string }[] = [
    {
      value: "asc",
      label:
        SEARCH_TRANSLATIONS["search.sort_low_to_high"] ??
        t("search.sort_low_to_high") ??
        "Low to high",
    },
    {
      value: "desc",
      label:
        SEARCH_TRANSLATIONS["search.sort_high_to_low"] ??
        t("search.sort_high_to_low") ??
        "High to low",
    },
  ];

  return (
    <Box className="flex flex-col gap-4">
      <Box className="flex min-w-0 flex-row items-stretch gap-2">
        <Box className="min-w-0 flex-1">
          <Dropdown<ResultsOrderBy>
            label={
              SEARCH_TRANSLATIONS["search.display_order_by"] ??
              t("search.display_order_by") ??
              "Order by"
            }
            size="sm"
            noBorder
            menuInPortal
            menuPortalStack={menuPortalStack}
            registerOutsideClickSafeTarget={registerOutsideClickSafeTarget}
            value={resultsOrderBy}
            options={orderOptions}
            onChange={handleOrder}
          />
        </Box>
        <Box className="min-w-0 flex-1">
          <Dropdown<ResultsSortDirection>
            label={
              SEARCH_TRANSLATIONS["search.display_sort_direction"] ??
              t("search.display_sort_direction") ??
              "Sort direction"
            }
            size="sm"
            noBorder
            menuInPortal
            menuPortalStack={menuPortalStack}
            registerOutsideClickSafeTarget={registerOutsideClickSafeTarget}
            value={resultsSortDirection}
            options={directionOptions}
            onChange={handleSortDirection}
          />
        </Box>
      </Box>
      <Box className="flex flex-col gap-1.5">
        <Box className="flex flex-row items-center justify-between gap-3">
          <BodyText as="span" size="sm" className="text-text-primary shrink-0">
            {SEARCH_TRANSLATIONS["search.show_commute_area"] ?? "Show commute area"}
          </BodyText>
          <OliveCheckbox
            checked={showCommuteOverlay}
            onToggle={() => handleCommute(!showCommuteOverlay)}
          />
        </Box>
        <Subtitle size="xs" muted className="pl-0 pr-10">
          {SEARCH_TRANSLATIONS["search.show_commute_area_hint"] ??
            "For searches from your profile (important locations). Shows drive-time areas when on, or a simple bounds around those places when off. Map-only searches use the place or area you picked instead."}
        </Subtitle>
      </Box>
    </Box>
  );
}
