import React, { useCallback, useState } from "react";

import { useLocalization } from "packages/contexts";
import {
  SEARCH_HEADER_PANEL_CLASS_DEFAULT,
  SEARCH_HEADER_PANEL_MAX_HEIGHT,
} from "packages/features/search/components/header/searchHeaderConstants";
import { useSearchDisplaySettings } from "packages/features/search/hooks/data/useSearchDisplaySettings";
import { useFiltersStore } from "packages/features/search/store/filters.slice";
import {
  isResultsOrderBy,
  MAP_HOME_CARDS_MAX,
  MAP_HOME_CARDS_MIN,
  RESULTS_ORDER_BY_OPTIONS,
  type ResultsOrderBy,
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
  const mapHomeCardsCount = useFiltersStore((s) => s.mapHomeCardsCount);
  const setMapHomeCardsCount = useFiltersStore((s) => s.setMapHomeCardsCount);
  const resultsOrderBy = useFiltersStore((s) => s.resultsOrderBy);
  const setResultsOrderBy = useFiltersStore((s) => s.setResultsOrderBy);
  const preferencesStrictFilter = useFiltersStore(
    (s) => s.preferencesStrictFilter,
  );
  const setPreferencesStrictFilter = useFiltersStore(
    (s) => s.setPreferencesStrictFilter,
  );

  const handleCommute = useCallback(
    (checked: boolean) => {
      setShowCommuteOverlay(checked);
      patchSearchDisplay({ show_commute_overlay: checked });
    },
    [setShowCommuteOverlay, patchSearchDisplay],
  );

  const handleCards = useCallback(
    (v: string) => {
      const n = Number.parseInt(v, 10);
      if (!Number.isFinite(n)) return;
      setMapHomeCardsCount(n);
      patchSearchDisplay({ map_home_cards_count: n });
    },
    [setMapHomeCardsCount, patchSearchDisplay],
  );

  const handleOrder = useCallback(
    (v: ResultsOrderBy) => {
      if (!isResultsOrderBy(v)) return;
      setResultsOrderBy(v);
      patchSearchDisplay({ results_order_by: v });
    },
    [setResultsOrderBy, patchSearchDisplay],
  );

  const handleStrictPreferences = useCallback(
    (checked: boolean) => {
      setPreferencesStrictFilter(checked);
      patchSearchDisplay({ preferences_strict_filter: checked });
    },
    [setPreferencesStrictFilter, patchSearchDisplay],
  );

  const cardOptions = Array.from(
    { length: MAP_HOME_CARDS_MAX - MAP_HOME_CARDS_MIN + 1 },
    (_, i) => MAP_HOME_CARDS_MIN + i,
  ).map((n) => ({ value: String(n), label: String(n) }));

  const orderOptions = RESULTS_ORDER_BY_OPTIONS.map((value) => ({
    value,
    label: ORDER_LABELS[value],
  }));

  const displayLabel =
    t("search.display") ?? SEARCH_TRANSLATIONS["search.display"] ?? "Display";

  const renderPanel = (
    registerOutsideClickSafeTarget: (element: HTMLElement) => () => void,
  ) => (
    <Box className="flex flex-col gap-4">
      <Box className="flex flex-row items-center justify-between gap-3">
        <BodyText as="span" size="sm" className="text-text-primary shrink-0">
          {SEARCH_TRANSLATIONS["search.show_commute_area"] ??
            "Show commute area"}
        </BodyText>
        <OliveCheckbox
          checked={showCommuteOverlay}
          onToggle={() => handleCommute(!showCommuteOverlay)}
        />
      </Box>
      <Box className="flex flex-col gap-1.5">
        <Box className="flex flex-row items-center justify-between gap-3">
          <BodyText as="span" size="sm" className="text-text-primary shrink-0">
            {SEARCH_TRANSLATIONS["search.strict_preferences"] ??
              "Match all preferences strictly"}
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
      <Dropdown
        label={
          SEARCH_TRANSLATIONS["search.display_map_cards"] ??
          t("search.display_map_cards") ??
          "Homes on map"
        }
        size="sm"
        noBorder
        menuInPortal
        registerOutsideClickSafeTarget={registerOutsideClickSafeTarget}
        value={String(mapHomeCardsCount)}
        options={cardOptions}
        onChange={handleCards}
      />
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
        {({ registerOutsideClickSafeTarget }) =>
          renderPanel(registerOutsideClickSafeTarget)
        }
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
      {({ registerOutsideClickSafeTarget }) =>
        renderPanel(registerOutsideClickSafeTarget)
      }
    </Popover>
  );
}
