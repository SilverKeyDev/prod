import React, { useCallback, useRef, useState } from "react";

import { useLocalization } from "packages/contexts";
import { SEARCH_HEADER_PANEL_MAX_HEIGHT } from "packages/features/search/components/header/searchHeaderConstants";
import { useSearchFilterControlsOverflow } from "packages/features/search/hooks/ui/useSearchFilterControlsOverflow.web";
import {
  formatPriceRange,
  getBedBathSummary,
} from "packages/features/search/types/search/filters/searchFilterSummaries";
import { getSearchFilterHomeTypeLabel } from "packages/features/search/utils/filters/searchFilterControlsHomeTypeLabel.web";
import {
  SEARCH_HEADER_FILTER_PROMOTION_ORDER,
  type SearchHeaderFilterId,
} from "packages/features/search/utils/filters/searchHeaderFilterOrder";
import { useContainerWidth } from "packages/hooks/ui/useContainerWidth";
import { useSearchContextStore } from "packages/store";
import { Box } from "packages/ui/components/primitives";
import { HEADER_ROW_HEIGHT } from "packages/ui/constants/layout";

import { BodyText, Button, DropdownChevron, Popover } from "@/components/ui";
import PreferencesSaveStatusRow from "@/features/profile/components/settings/inputs/PreferencesSaveStatusRow";
import type { OnboardingData } from "@/features/profile/utils";
import BedBathFilter from "@/features/search/components/filters/BedBathFilter.web";
import HomeTypeFilter from "@/features/search/components/filters/HomeTypeFilter.web";
import OtherFilterContent from "@/features/search/components/filters/OtherFilterContent.web";
import PriceRangeFilter from "@/features/search/components/filters/PriceRangeFilter.web";

import SearchFilterChip from "./SearchFilterChip.web";
import {
  searchFilterControlsButtonBase,
  searchFilterControlsHomeTypePanelClass,
  searchFilterControlsMorePopoverPanelClass,
  searchFilterControlsPanelClass,
} from "./searchFilterControls.web.styles";
import { SearchFilterControlsMorePlaceholder } from "./SearchFilterControlsMorePlaceholder.web";

export type SearchFilterControlsProps = {
  formData: Partial<OnboardingData>;
  updateFormData: (field: string | number | symbol, value: unknown) => void;
  saveStatus?: "idle" | "saving" | "saved";
  onPreferencesChanged?: () => void | Promise<void>;
  onPopoverClose?: () => void;
  variant?: "desktop" | "mobile";
};

export default function SearchFilterControls({
  formData,
  updateFormData,
  saveStatus = "idle",
  onPopoverClose,
  variant: _variant = "desktop",
}: SearchFilterControlsProps): React.ReactElement {
  const { t } = useLocalization();
  const [moreOpen, setMoreOpen] = useState(false);
  const setSearchFilterOverrides = useSearchContextStore((s) => s.setSearchFilterOverrides);

  const containerRef = useRef<HTMLDivElement>(null);
  const containerWidth = useContainerWidth(containerRef, { minDelta: 5 });
  const { overflowFromIndex, measureRefs, measureRefMore } =
    useSearchFilterControlsOverflow(containerWidth);

  const closeMorePopover = useCallback(() => {
    setMoreOpen(false);
    onPopoverClose?.();
  }, [onPopoverClose]);

  const priceMin = formData.home_budget_min ?? 100_000;
  const priceMax = formData.home_budget_max ?? 2_000_000;
  const minBeds = formData.preferred_bedrooms_min ?? 0;
  const maxBeds = formData.preferred_bedrooms_max ?? 8;
  const minBaths = formData.preferred_bathrooms_min ?? 0;
  const maxBaths = formData.preferred_bathrooms_max ?? 8;
  const housingType = formData.preferred_housing_type ?? "";

  const renderChip = useCallback(
    (id: SearchHeaderFilterId): React.ReactNode => {
      switch (id) {
        case "price":
          return (
            <SearchFilterChip
              label="Price"
              summary={formatPriceRange(priceMin, priceMax)}
              panelClassName={searchFilterControlsPanelClass}
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
              panelClassName={searchFilterControlsPanelClass}
              panelMinWidth="320px"
              side="bottom"
            >
              {() => (
                <BedBathFilter
                  minBeds={minBeds}
                  maxBeds={maxBeds}
                  minBaths={minBaths}
                  maxBaths={maxBaths}
                  onMinBedsChange={(v) => updateFormData("preferred_bedrooms_min", v)}
                  onMaxBedsChange={(v) => {
                    updateFormData("preferred_bedrooms_max", v);
                    setSearchFilterOverrides((prev) => ({
                      ...prev,
                      preferred_bedrooms_max: v,
                    }));
                  }}
                  onMinBathsChange={(v) => updateFormData("preferred_bathrooms_min", v)}
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
              summary={getSearchFilterHomeTypeLabel(housingType)}
              panelClassName={searchFilterControlsHomeTypePanelClass}
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
                onMinBedsChange={(v) => updateFormData("preferred_bedrooms_min", v)}
                onMaxBedsChange={(v) => {
                  updateFormData("preferred_bedrooms_max", v);
                  setSearchFilterOverrides((prev) => ({
                    ...prev,
                    preferred_bedrooms_max: v,
                  }));
                }}
                onMinBathsChange={(v) => updateFormData("preferred_bathrooms_min", v)}
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
        onSearchFilterOverridesPatch={(patch) =>
          setSearchFilterOverrides((prev) => ({ ...prev, ...patch }))
        }
      />
    </>
  );

  return (
    <>
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
          <SearchFilterControlsMorePlaceholder t={t} />
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
          panelClassName={searchFilterControlsMorePopoverPanelClass}
          panelMaxHeight={SEARCH_HEADER_PANEL_MAX_HEIGHT}
          panelMinWidth="320px"
          trigger={({ open: isActive, onToggle }) => (
            <Button
              type="button"
              onClick={onToggle}
              variant={isActive ? "outline" : "secondary"}
              size="sm"
              rounded="lg"
              className={searchFilterControlsButtonBase}
              aria-expanded={isActive}
              aria-haspopup="true"
              iconName="search"
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
