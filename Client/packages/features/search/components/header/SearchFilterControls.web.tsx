import React, { useCallback, useLayoutEffect, useRef, useState } from "react";

import { useLocalization } from "packages/contexts";
import {
  formatPriceRange,
  getBedBathSummary,
} from "packages/features/search/types/search/searchFilterSummaries";
import {
  SEARCH_HEADER_FILTER_GAP_PX,
  SEARCH_HEADER_FILTER_PROMOTION_ORDER,
  type SearchHeaderFilterId,
} from "packages/features/search/utils/searchHeaderFilterOrder";
import { useContainerWidth } from "packages/hooks/ui/useContainerWidth";
import { useSearchContextStore } from "packages/store";
import { Box } from "packages/ui/components/primitives";
import { HEADER_ROW_HEIGHT } from "packages/ui/constants/layout";

import { BodyText, Button, DropdownChevron, Popover } from "@/components/ui";
import PreferencesSaveStatusRow from "@/features/profile/components/settings/inputs/PreferencesSaveStatusRow";
import type { OnboardingData } from "@/features/profile/utils";
import { HOUSING_TYPE_OPTIONS } from "@/features/profile/utils";
import BedBathFilter from "@/features/search/components/filters/BedBathFilter.web";
import HomeTypeFilter from "@/features/search/components/filters/HomeTypeFilter.web";
import OtherFilterContent from "@/features/search/components/filters/OtherFilterContent.web";
import PriceRangeFilter from "@/features/search/components/filters/PriceRangeFilter.web";

import SearchFilterChip from "./SearchFilterChip.web";
import {
  SEARCH_HEADER_PANEL_CLASS_DEFAULT,
  SEARCH_HEADER_PANEL_CLASS_HOME_TYPE,
  SEARCH_HEADER_PANEL_MAX_HEIGHT,
} from "./searchHeaderConstants";
const panelClass = SEARCH_HEADER_PANEL_CLASS_DEFAULT;
/** Hide horizontal scrollbar on stacked filter sections (sliders slightly wider than panel). */
const morePopoverPanelClass = `${SEARCH_HEADER_PANEL_CLASS_DEFAULT} overflow-x-hidden`;
const homeTypePanelClass = SEARCH_HEADER_PANEL_CLASS_HOME_TYPE;
const buttonBase = `inline-flex items-center gap-1.5 rounded-lg border px-4 text-sm font-medium transition-colors whitespace-nowrap shrink-0 justify-between ${HEADER_ROW_HEIGHT}`;

function getHomeTypeLabel(value: string): string {
  if (!value) return "Any";
  const values = value
    .split(",")
    .map((v) => v.trim())
    .filter(Boolean);
  if (values.length === 0) return "Any";
  const labels = values.map((v) => HOUSING_TYPE_OPTIONS.find((o) => o.value === v)?.label ?? v);
  return labels.join(", ");
}

export type SearchFilterControlsProps = {
  formData: Partial<OnboardingData>;
  updateFormData: (field: string | number | symbol, value: unknown) => void;
  saveStatus?: "idle" | "saving" | "saved";
  onPreferencesChanged?: () => void | Promise<void>;
  /** Called when the More popover is closed */
  onPopoverClose?: () => void;
  variant?: "desktop" | "mobile";
};

/** Placeholder More button used only for measuring width in the hidden row */
function MoreButtonPlaceholder({ t }: { t: (key: string) => string }) {
  return (
    <Button
      type="button"
      variant="secondary"
      size="sm"
      rounded="lg"
      className={`${buttonBase} justify-between`}
    >
      <Box className="flex w-full items-center justify-between gap-2">
        <BodyText as="span" size="sm" className="text-inherit">
          {t("search.more")}
        </BodyText>
        <DropdownChevron open={false} className="h-4 w-4" />
      </Box>
    </Button>
  );
}

export default function SearchFilterControls({
  formData,
  updateFormData,
  saveStatus = "idle",
  onPopoverClose,
  variant: _variant = "desktop",
}: SearchFilterControlsProps): React.ReactElement {
  const { t } = useLocalization();
  const [moreOpen, setMoreOpen] = useState(false);
  const [overflowFromIndex, setOverflowFromIndex] = useState(3);
  const setSearchFilterOverrides = useSearchContextStore((s) => s.setSearchFilterOverrides);

  const containerRef = useRef<HTMLDivElement>(null);
  const measureRefs = useRef<(HTMLDivElement | null)[]>(
    Array.from({ length: SEARCH_HEADER_FILTER_PROMOTION_ORDER.length }, () => null)
  );
  const measureRefMore = useRef<HTMLDivElement>(null);

  const containerWidth = useContainerWidth(containerRef, { minDelta: 5 });

  const closeMorePopover = useCallback(() => {
    setMoreOpen(false);
    onPopoverClose?.();
  }, [onPopoverClose]);

  const priceMin = formData.home_budget_min ?? 100_000;
  const priceMax = formData.home_budget_max ?? 2_000_000;
  const minBeds = formData.preferred_bedrooms ?? 0;
  const maxBeds = formData.preferred_bedrooms_max ?? 8;
  const minBaths = formData.preferred_bathrooms ?? 0;
  const maxBaths = formData.preferred_bathrooms_max ?? 8;
  const housingType = formData.preferred_housing_type ?? "";

  useLayoutEffect(() => {
    if (containerWidth <= 0) return;
    const chipWidths = measureRefs.current.map((el) => el?.getBoundingClientRect().width ?? 0);
    const moreWidth = measureRefMore.current?.getBoundingClientRect().width ?? 0;
    if (moreWidth <= 0) return;
    const need = moreWidth + SEARCH_HEADER_FILTER_GAP_PX;
    let numVisibleInHeader = 0;
    for (let i = 0; i <= SEARCH_HEADER_FILTER_PROMOTION_ORDER.length; i++) {
      const chipSum = i === 0 ? 0 : chipWidths.slice(0, i).reduce((a, b) => a + b, 0);
      const total = chipSum + i * SEARCH_HEADER_FILTER_GAP_PX + need;
      if (total <= containerWidth) numVisibleInHeader = i;
      else break;
    }
    setOverflowFromIndex(numVisibleInHeader);
  }, [containerWidth]);

  const renderChip = useCallback(
    (id: SearchHeaderFilterId): React.ReactNode => {
      switch (id) {
        case "price":
          return (
            <SearchFilterChip
              label="Price"
              summary={formatPriceRange(priceMin, priceMax)}
              panelClassName={panelClass}
              panelMinWidth="320px"
              side="bottom"
            >
              {() => (
                <PriceRangeFilter
                  minValue={priceMin}
                  maxValue={priceMax}
                  onChange={(minVal, maxVal) => {
                    updateFormData("home_budget_min", minVal);
                    updateFormData("home_budget_max", maxVal);
                  }}
                />
              )}
            </SearchFilterChip>
          );
        case "bedsBaths":
          return (
            <SearchFilterChip
              label="Beds & baths"
              summary={getBedBathSummary(minBeds, maxBeds, minBaths, maxBaths)}
              panelClassName={panelClass}
              panelMinWidth="320px"
              side="bottom"
            >
              {() => (
                <BedBathFilter
                  minBeds={minBeds}
                  maxBeds={maxBeds}
                  minBaths={minBaths}
                  maxBaths={maxBaths}
                  onMinBedsChange={(v) => updateFormData("preferred_bedrooms", v)}
                  onMaxBedsChange={(v) => {
                    updateFormData("preferred_bedrooms_max", v);
                    setSearchFilterOverrides((prev) => ({
                      ...prev,
                      preferred_bedrooms_max: v,
                    }));
                  }}
                  onMinBathsChange={(v) => updateFormData("preferred_bathrooms", v)}
                  onMaxBathsChange={(v) => {
                    updateFormData("preferred_bathrooms_max", v);
                    setSearchFilterOverrides((prev) => ({
                      ...prev,
                      preferred_bathrooms_max: v,
                    }));
                  }}
                />
              )}
            </SearchFilterChip>
          );
        case "homeType":
          return (
            <SearchFilterChip
              label="Home type"
              summary={getHomeTypeLabel(housingType)}
              panelClassName={homeTypePanelClass}
              panelMinWidth="260px"
              side="bottom"
            >
              {() => (
                <HomeTypeFilter
                  value={housingType}
                  onChange={(v) => updateFormData("preferred_housing_type", v)}
                />
              )}
            </SearchFilterChip>
          );
      }
    },
    [
      priceMin,
      priceMax,
      minBeds,
      maxBeds,
      minBaths,
      maxBaths,
      housingType,
      updateFormData,
      setSearchFilterOverrides,
    ]
  );

  const renderOverflowSection = useCallback(
    (id: SearchHeaderFilterId): React.ReactNode => {
      const sectionClass = "border-border border-b pb-4";
      switch (id) {
        case "price":
          return (
            <section className={sectionClass}>
              <BodyText as="h3" size="sm" className="mb-1 font-medium">
                Price
              </BodyText>
              <BodyText size="sm" muted className="mb-2">
                {formatPriceRange(priceMin, priceMax)}
              </BodyText>
              <PriceRangeFilter
                minValue={priceMin}
                maxValue={priceMax}
                onChange={(minVal, maxVal) => {
                  updateFormData("home_budget_min", minVal);
                  updateFormData("home_budget_max", maxVal);
                }}
              />
            </section>
          );
        case "bedsBaths":
          return (
            <section className={sectionClass}>
              <BodyText as="h3" size="sm" className="mb-1 font-medium">
                Beds & baths
              </BodyText>
              <BodyText size="sm" muted className="mb-2">
                {getBedBathSummary(minBeds, maxBeds, minBaths, maxBaths)}
              </BodyText>
              <BedBathFilter
                minBeds={minBeds}
                maxBeds={maxBeds}
                minBaths={minBaths}
                maxBaths={maxBaths}
                onMinBedsChange={(v) => updateFormData("preferred_bedrooms", v)}
                onMaxBedsChange={(v) => {
                  updateFormData("preferred_bedrooms_max", v);
                  setSearchFilterOverrides((prev) => ({
                    ...prev,
                    preferred_bedrooms_max: v,
                  }));
                }}
                onMinBathsChange={(v) => updateFormData("preferred_bathrooms", v)}
                onMaxBathsChange={(v) => {
                  updateFormData("preferred_bathrooms_max", v);
                  setSearchFilterOverrides((prev) => ({
                    ...prev,
                    preferred_bathrooms_max: v,
                  }));
                }}
              />
            </section>
          );
        case "homeType":
          return (
            <section className={sectionClass}>
              <BodyText as="h3" size="sm" className="mb-2 font-medium">
                Home type
              </BodyText>
              <HomeTypeFilter
                value={housingType}
                onChange={(v) => updateFormData("preferred_housing_type", v)}
              />
            </section>
          );
      }
    },
    [
      priceMin,
      priceMax,
      minBeds,
      maxBeds,
      minBaths,
      maxBaths,
      housingType,
      updateFormData,
      setSearchFilterOverrides,
    ]
  );

  const overflowPanelContent = (
    <>
      <PreferencesSaveStatusRow
        saveStatus={saveStatus}
        savingLabel={t("common.saving")}
        savedLabel={t("common.saved")}
        className="border-border mb-3 flex items-center gap-2 border-b pb-3 text-sm"
      />
      {SEARCH_HEADER_FILTER_PROMOTION_ORDER.map(
        (id, index) =>
          index >= overflowFromIndex && (
            <React.Fragment key={id}>{renderOverflowSection(id)}</React.Fragment>
          )
      )}
      <OtherFilterContent
        formData={formData}
        updateFormData={updateFormData}
        hideHousingType={true}
      />
    </>
  );

  return (
    <>
      {/* Hidden row used only to measure chip and More button widths */}
      <Box
        aria-hidden="true"
        className="pointer-events-none absolute -left-full top-0 flex items-center gap-2"
        style={{ visibility: "hidden" }}
      >
        {SEARCH_HEADER_FILTER_PROMOTION_ORDER.map((id, index) => (
          <Box
            key={id}
            ref={(el) => {
              measureRefs.current[index] = el;
            }}
          >
            {renderChip(id)}
          </Box>
        ))}
        <Box ref={measureRefMore}>
          <MoreButtonPlaceholder t={t} />
        </Box>
      </Box>

      <Box
        ref={containerRef}
        className={`flex min-w-0 flex-nowrap items-center gap-2 ${HEADER_ROW_HEIGHT}`}
      >
        {SEARCH_HEADER_FILTER_PROMOTION_ORDER.slice(0, overflowFromIndex).map((id) => (
          <Box key={id} className="shrink-0">
            {renderChip(id)}
          </Box>
        ))}

        <Popover
          open={moreOpen}
          onOpenChange={(open) => {
            if (!open) closeMorePopover();
            else setMoreOpen(true);
          }}
          usePortal={true}
          side="left"
          panelClassName={morePopoverPanelClass}
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
                  {t("search.more")}
                </BodyText>
                <DropdownChevron open={isActive} className="h-4 w-4" />
              </Box>
            </Button>
          )}
        >
          {() => overflowPanelContent}
        </Popover>
      </Box>
    </>
  );
}
