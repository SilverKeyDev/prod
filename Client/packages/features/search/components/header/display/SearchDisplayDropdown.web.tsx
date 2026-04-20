import React, { useCallback, useState } from "react";

import { getEnv } from "packages/config/env";
import { useLocalization } from "packages/contexts";
import {
  SEARCH_HEADER_PANEL_CLASS_DEFAULT,
  SEARCH_HEADER_PANEL_MAX_HEIGHT,
} from "packages/features/search/components/header/searchHeaderConstants";
import { useSearchDisplaySettings } from "packages/features/search/hooks/data/useSearchDisplaySettings";
import { useFiltersStore } from "packages/features/search/store/filters.slice";
import {
  isResultsOrderBy,
  isResultsSortDirection,
  RESULTS_ORDER_BY_OPTIONS,
  type ResultsOrderBy,
  type ResultsSortDirection,
} from "packages/features/search/types/searchDisplay";
import { SEARCH_TRANSLATIONS } from "packages/features/search/types/translations";
import { useAuthStore } from "packages/store";
import { Box } from "packages/ui/components/primitives";
import { HEADER_ROW_HEIGHT } from "packages/ui/constants/layout";

import {
  BodyText,
  Button,
  Dropdown,
  DropdownChevron,
  OliveCheckbox,
  Popover,
  Subtitle,
} from "@/components/ui";

const panelClass = `${SEARCH_HEADER_PANEL_CLASS_DEFAULT} overflow-x-hidden`;

const ORDER_LABELS: Record<ResultsOrderBy, string> = {
  match_score: SEARCH_TRANSLATIONS["search.order_match_score"] ?? "Match score",
  price: SEARCH_TRANSLATIONS["search.order_price"] ?? "Price",
  distance: SEARCH_TRANSLATIONS["search.order_distance"] ?? "Distance",
  bedrooms: SEARCH_TRANSLATIONS["search.order_bedrooms"] ?? "Bedrooms",
  bathrooms: SEARCH_TRANSLATIONS["search.order_bathrooms"] ?? "Bathrooms",
  lot_size: SEARCH_TRANSLATIONS["search.order_lot_size"] ?? "Lot size",
  home_age: SEARCH_TRANSLATIONS["search.order_home_age"] ?? "Home age",
};

const buttonBase = `inline-flex items-center gap-1.5 rounded-lg px-4 text-sm font-medium transition-colors whitespace-nowrap shrink-0 justify-between ${HEADER_ROW_HEIGHT}`;

type SearchDisplayDropdownProps = {
  variant?: "desktop" | "mobile";
};

export default function SearchDisplayDropdown({
  variant = "desktop",
}: SearchDisplayDropdownProps): React.ReactElement {
  const { t } = useLocalization();
  const authReady = useAuthStore((s) => s.authReady);
  const { patchSearchDisplay } = useSearchDisplaySettings(authReady);
  const [open, setOpen] = useState(false);

  const showCommuteOverlay = useFiltersStore((s) => s.showCommuteOverlay);
  const setShowCommuteOverlay = useFiltersStore((s) => s.setShowCommuteOverlay);
  const resultsOrderBy = useFiltersStore((s) => s.resultsOrderBy);
  const setResultsOrderBy = useFiltersStore((s) => s.setResultsOrderBy);
  const resultsSortDirection = useFiltersStore((s) => s.resultsSortDirection);
  const setResultsSortDirection = useFiltersStore((s) => s.setResultsSortDirection);
  const preferencesStrictFilter = useFiltersStore((s) => s.preferencesStrictFilter);
  const setPreferencesStrictFilter = useFiltersStore((s) => s.setPreferencesStrictFilter);
  const hasSearched = useFiltersStore((s) => s.hasSearched);
  const showMapListingPreviews = useFiltersStore((s) => s.showMapListingPreviews);
  const setShowMapListingPreviews = useFiltersStore((s) => s.setShowMapListingPreviews);
  const isDev = getEnv().isDevelopment;

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

  const handleStrictPreferences = useCallback(
    (checked: boolean) => {
      setPreferencesStrictFilter(checked);
      patchSearchDisplay({ preferences_strict_filter: checked });
    },
    [setPreferencesStrictFilter, patchSearchDisplay]
  );

  const handleMapListingPreviews = useCallback(
    (checked: boolean) => {
      setShowMapListingPreviews(checked);
    },
    [setShowMapListingPreviews]
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

  const displayLabel = t("search.display") ?? SEARCH_TRANSLATIONS["search.display"] ?? "Display";

  const renderPanel = (registerOutsideClickSafeTarget: (element: HTMLElement) => () => void) => (
    <Box className="flex flex-col gap-4">
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
      <Box className="flex flex-col gap-1.5">
        <Box className="flex flex-row items-center justify-between gap-3">
          <BodyText as="span" size="sm" className="text-text-primary shrink-0">
            {SEARCH_TRANSLATIONS["search.strict_preferences"] ?? "Match all preferences strictly"}
          </BodyText>
          <OliveCheckbox
            checked={preferencesStrictFilter}
            onToggle={() => handleStrictPreferences(!preferencesStrictFilter)}
          />
        </Box>
        <Subtitle size="xs" muted className="pl-0 pr-10">
          {SEARCH_TRANSLATIONS["search.strict_preferences_hint"] ??
            "When off, we only apply every preference filter when there are more than 100 homes in the search area."}
        </Subtitle>
      </Box>
      {isDev ? (
        <Box className="flex flex-col gap-1.5">
          <Box className="flex flex-row items-center justify-between gap-3">
            <BodyText as="span" size="sm" className="text-text-primary shrink-0">
              {SEARCH_TRANSLATIONS["search.show_map_listing_previews"] ??
                "Show listing previews on map (dev)"}
            </BodyText>
            <OliveCheckbox
              checked={showMapListingPreviews}
              onToggle={
                hasSearched ? () => handleMapListingPreviews(!showMapListingPreviews) : undefined
              }
            />
          </Box>
          <Subtitle size="xs" muted className="pl-0 pr-10">
            {SEARCH_TRANSLATIONS["search.show_map_listing_previews_hint"] ??
              "Floating home cards on the map. Run a search first."}
          </Subtitle>
        </Box>
      ) : null}
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
            registerOutsideClickSafeTarget={registerOutsideClickSafeTarget}
            value={resultsSortDirection}
            options={directionOptions}
            onChange={handleSortDirection}
          />
        </Box>
      </Box>
    </Box>
  );

  if (variant === "mobile") {
    return (
      <Popover
        open={open}
        onOpenChange={setOpen}
        usePortal
        side="left"
        panelClassName={panelClass}
        panelMaxHeight={SEARCH_HEADER_PANEL_MAX_HEIGHT}
        panelMinWidth="320px"
        trigger={({ open: isActive, onToggle }) => (
          <Button
            type="button"
            onClick={onToggle}
            variant={isActive ? "outline" : "cancel"}
            size="sm"
            rounded="lg"
            className={`touch-friendly shrink-0 ${buttonBase}`}
            aria-expanded={isActive}
            aria-haspopup="true"
          >
            <Box className="flex w-full items-center justify-between gap-2">
              <BodyText as="span" size="sm" className="text-inherit">
                {displayLabel}
              </BodyText>
              <DropdownChevron open={isActive} className="h-4 w-4" />
            </Box>
          </Button>
        )}
      >
        {({ registerOutsideClickSafeTarget }) => renderPanel(registerOutsideClickSafeTarget)}
      </Popover>
    );
  }

  return (
    <Popover
      open={open}
      onOpenChange={setOpen}
      usePortal
      side="left"
      panelClassName={panelClass}
      panelMaxHeight={SEARCH_HEADER_PANEL_MAX_HEIGHT}
      panelMinWidth="320px"
      trigger={({ open: isActive, onToggle }) => (
        <Button
          type="button"
          onClick={onToggle}
          variant={isActive ? "outline" : "secondary"}
          size="sm"
          rounded="lg"
          className={buttonBase}
          aria-expanded={isActive}
          aria-haspopup="true"
        >
          <Box className="flex w-full items-center justify-between gap-2">
            <BodyText as="span" size="sm" className="text-inherit">
              {displayLabel}
            </BodyText>
            <DropdownChevron open={isActive} className="h-4 w-4" />
          </Box>
        </Button>
      )}
    >
      {({ registerOutsideClickSafeTarget }) => renderPanel(registerOutsideClickSafeTarget)}
    </Popover>
  );
}
