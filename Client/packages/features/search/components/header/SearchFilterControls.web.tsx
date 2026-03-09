import React, { useCallback, useLayoutEffect, useRef, useState } from "react";

import { useLocalization } from "packages/contexts";
import {
  formatPriceRange,
  getBedBathSummary,
} from "packages/features/search/types/search/searchFilterSummaries";
import { useContainerWidth } from "packages/hooks/ui/useContainerWidth";
import { useSearchContextStore } from "packages/store";
import { HEADER_ROW_HEIGHT } from "packages/ui/constants/layout";

import { BodyText, Button, DropdownChevron, Popover } from "@/components/ui";
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

const GAP_PX = 8;
const panelClass = SEARCH_HEADER_PANEL_CLASS_DEFAULT;
const homeTypePanelClass = SEARCH_HEADER_PANEL_CLASS_HOME_TYPE;
const buttonBase = `inline-flex items-center gap-1.5 rounded-lg border px-3 text-sm font-medium transition-colors whitespace-nowrap shrink-0 justify-between ${HEADER_ROW_HEIGHT}`;

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
      <div className="flex w-full items-center justify-between gap-2">
        <BodyText as="span" size="sm" className="text-inherit">
          {t("search.more")}
        </BodyText>
        <DropdownChevron open={false} className="h-4 w-4" />
      </div>
    </Button>
  );
}

export default function SearchFilterControls({
  formData,
  updateFormData,
  onPopoverClose,
  variant: _variant = "desktop",
}: SearchFilterControlsProps): React.ReactElement {
  const { t } = useLocalization();
  const [moreOpen, setMoreOpen] = useState(false);
  const [overflowFromIndex, setOverflowFromIndex] = useState(3);
  const setSearchFilterOverrides = useSearchContextStore((s) => s.setSearchFilterOverrides);

  const containerRef = useRef<HTMLDivElement>(null);
  const measureRef0 = useRef<HTMLDivElement>(null);
  const measureRef1 = useRef<HTMLDivElement>(null);
  const measureRef2 = useRef<HTMLDivElement>(null);
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
    const refs = [measureRef0, measureRef1, measureRef2, measureRefMore];
    const widths = refs.map((r) => r.current?.getBoundingClientRect().width ?? 0);
    const moreWidth = widths[3];
    if (moreWidth <= 0) return;
    const need = moreWidth + GAP_PX;
    let n = 0;
    for (let i = 0; i <= 3; i++) {
      const total =
        (i === 0 ? 0 : widths.slice(0, i).reduce((a, b) => a + b, 0)) + i * GAP_PX + need;
      if (total <= containerWidth) n = i;
      else break;
    }
    setOverflowFromIndex(n);
  }, [containerWidth]);

  const renderPriceChip = () => (
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

  const renderBedBathChip = () => (
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

  const renderHomeTypeChip = () => (
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

  const overflowPanelContent = (
    <>
      {overflowFromIndex <= 0 && (
        <section className="border-b border-gray-200 pb-4">
          <BodyText as="h3" size="sm" className="mb-2 font-medium">
            Price
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
      )}
      {overflowFromIndex <= 1 && (
        <section className="border-b border-gray-200 pb-4">
          <BodyText as="h3" size="sm" className="mb-2 font-medium">
            Beds & baths
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
      )}
      {overflowFromIndex <= 2 && (
        <section className="border-b border-gray-200 pb-4">
          <BodyText as="h3" size="sm" className="mb-2 font-medium">
            Home type
          </BodyText>
          <HomeTypeFilter
            value={housingType}
            onChange={(v) => updateFormData("preferred_housing_type", v)}
          />
        </section>
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
      <div
        aria-hidden="true"
        className="pointer-events-none absolute -left-full top-0 flex items-center gap-2"
        style={{ visibility: "hidden" }}
      >
        <div ref={measureRef0}>{renderPriceChip()}</div>
        <div ref={measureRef1}>{renderBedBathChip()}</div>
        <div ref={measureRef2}>{renderHomeTypeChip()}</div>
        <div ref={measureRefMore}>
          <MoreButtonPlaceholder t={t} />
        </div>
      </div>

      <div
        ref={containerRef}
        className={`flex min-w-0 flex-nowrap items-center gap-2 ${HEADER_ROW_HEIGHT}`}
      >
        {overflowFromIndex >= 1 && <div className="shrink-0">{renderPriceChip()}</div>}
        {overflowFromIndex >= 2 && <div className="shrink-0">{renderBedBathChip()}</div>}
        {overflowFromIndex >= 3 && <div className="shrink-0">{renderHomeTypeChip()}</div>}

        <Popover
          open={moreOpen}
          onOpenChange={(open) => {
            if (!open) closeMorePopover();
            else setMoreOpen(true);
          }}
          usePortal={true}
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
              <div className="flex w-full items-center justify-between gap-2">
                <BodyText as="span" size="sm" className="text-inherit">
                  {t("search.more")}
                </BodyText>
                <DropdownChevron open={isActive} className="h-4 w-4" />
              </div>
            </Button>
          )}
        >
          {() => overflowPanelContent}
        </Popover>
      </div>
    </>
  );
}
