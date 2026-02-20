import React, { useCallback, useState } from "react";

import { useLocalization } from "packages/contexts";
import { useSearchContextStore } from "packages/store";
import type { OnboardingData } from "packages/utils/domain/profile";
import { HOUSING_TYPE_OPTIONS } from "packages/utils/domain/profile";
import {
  formatPriceRange,
  getBedBathSummary,
} from "packages/utils/domain/search/searchFilterSummaries";

import {
  BodyText,
  Button,
  DropdownChevron,
  Popover,
} from "@/components/ui/index.web";
import BedBathFilter from "@/features/search/filters/BedBathFilter.web";
import HomeTypeFilter from "@/features/search/filters/HomeTypeFilter.web";
import OtherFilterContent from "@/features/search/filters/OtherFilterContent.web";
import PriceRangeFilter from "@/features/search/filters/PriceRangeFilter.web";

import SearchFilterChip from "./SearchFilterChip.web";

const FILTER_ROW_HEIGHT = "h-11";
const buttonBase = `inline-flex ${FILTER_ROW_HEIGHT} items-center gap-1.5 rounded-lg border px-3 text-sm font-medium transition-colors touch-friendly whitespace-nowrap shrink-0`;
const panelClass =
  "scrollbar-styled p-4 w-[min(90vw,420px)] max-h-[85vh] overflow-y-auto";
const homeTypePanelClass = "scrollbar-styled p-4 w-[min(90vw,280px)]";

function getHomeTypeLabel(value: string): string {
  if (!value) return "Any";
  const values = value
    .split(",")
    .map((v) => v.trim())
    .filter(Boolean);
  if (values.length === 0) return "Any";
  const labels = values.map(
    (v) => HOUSING_TYPE_OPTIONS.find((o) => o.value === v)?.label ?? v,
  );
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

export default function SearchFilterControls({
  formData,
  updateFormData,
  onPopoverClose,
  variant: _variant = "desktop",
}: SearchFilterControlsProps): React.ReactElement {
  const { t } = useLocalization();
  const [moreOpen, setMoreOpen] = useState(false);
  const setSearchFilterOverrides = useSearchContextStore(
    (s) => s.setSearchFilterOverrides,
  );

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

  return (
    <div className={`flex flex-wrap items-center gap-2 ${FILTER_ROW_HEIGHT}`}>
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

      <Popover
        open={moreOpen}
        onOpenChange={(open) => {
          if (!open) closeMorePopover();
          else setMoreOpen(true);
        }}
        usePortal={true}
        side="left"
        panelClassName={panelClass}
        panelMaxHeight="85vh"
        panelMinWidth="320px"
        trigger={({ open: isActive, onToggle }) => (
          <Button
            type="button"
            onClick={onToggle}
            variant={isActive ? "outline" : "secondary"}
            size="sm"
            rounded="lg"
            className={`${buttonBase} justify-between`}
            aria-expanded={isActive}
            aria-haspopup="true"
          >
            <div className="flex w-full items-center justify-between gap-2">
              <BodyText as="span" size="sm" className="text-inherit">
                {t("search.more")}
              </BodyText>
              <DropdownChevron open={isActive} className="h-4 w-4" />
            </div>
          </Button>
        )}
      >
        {() => (
          <OtherFilterContent
            formData={formData}
            updateFormData={updateFormData}
            hideHousingType={true}
          />
        )}
      </Popover>
    </div>
  );
}
