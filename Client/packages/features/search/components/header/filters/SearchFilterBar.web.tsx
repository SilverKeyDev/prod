import React, { useCallback, useState } from "react";

import { useLocalization } from "packages/contexts";
import type { PatchBuyerPreferenceExtensions } from "packages/features/profile";
import {
  SEARCH_HEADER_PANEL_CLASS_DEFAULT,
  SEARCH_HEADER_PANEL_MAX_HEIGHT,
} from "packages/features/search/components/header/searchHeaderConstants";
import { useRegisterSearchHeaderPopoverWhenOpen } from "packages/features/search/hooks/ui/popovers/searchHeaderPopoverDismiss.web";
import { type SearchFilterOverrides, useSearchContextStore } from "packages/store";
import { Box } from "packages/ui/components/primitives";
import { HEADER_ROW_CONTROL_HEIGHT, HEADER_ROW_HEIGHT } from "packages/ui/constants/layout";
import { TOUR_TARGETS_DESKTOP, TOUR_TARGETS_MOBILE } from "packages/utils/tour/tourTargets";

import { BodyText, Button, DropdownChevron, Popover } from "@/components/ui";
import type { OnboardingData } from "@/features/profile/utils";
import SearchPreferencesContent from "@/features/search/components/filters/SearchPreferencesContent.web";

import SearchFiltersSheet from "./SearchFiltersSheet.web";

const buttonBase = `inline-flex items-center gap-1.5 rounded-lg px-4 text-sm font-medium transition-colors whitespace-nowrap shrink-0 justify-between ${HEADER_ROW_CONTROL_HEIGHT}`;
const panelClass = `${SEARCH_HEADER_PANEL_CLASS_DEFAULT} overflow-x-hidden w-[min(90vw,520px)]`;

export type SearchFilterBarProps = {
  formData: Partial<OnboardingData>;
  updateFormData: (field: keyof OnboardingData, value: unknown) => void;
  onPopoverClose?: () => void;
  variant?: "desktop" | "mobile";
  selectedClientId?: string | null;
  onClientChange?: (clientId: string | null) => void;
  patchBuyerPreferenceExtensions: PatchBuyerPreferenceExtensions;
  scriptsReady: boolean;
  onAgentSyncPreferencesFetched?: (onboarding: Partial<OnboardingData>) => void;
  replaceFormData?: (next: Partial<OnboardingData>) => void;
  cancelPendingSave?: () => void;
  onAfterClear?: () => void | Promise<void>;
};

export default function SearchFilterBar({
  formData,
  updateFormData,
  onPopoverClose,
  variant = "desktop",
  selectedClientId,
  onClientChange,
  patchBuyerPreferenceExtensions,
  scriptsReady,
  onAgentSyncPreferencesFetched,
  replaceFormData,
  cancelPendingSave,
  onAfterClear,
}: SearchFilterBarProps): React.ReactElement {
  const { t } = useLocalization();
  const [sheetOpen, setSheetOpen] = useState(false);
  const [popoverOpen, setPopoverOpen] = useState(false);
  const setSearchFilterOverrides = useSearchContextStore((s) => s.setSearchFilterOverrides);

  const updateSearchFormData = useCallback(
    (field: keyof OnboardingData, value: unknown) => {
      updateFormData(field, value);
      if (
        field === "home_budget_min" ||
        field === "home_budget_max" ||
        field === "preferred_bedrooms_min" ||
        field === "preferred_bedrooms_max" ||
        field === "preferred_bathrooms_min" ||
        field === "preferred_bathrooms_max" ||
        field === "preferred_sqft_min" ||
        field === "preferred_sqft_max" ||
        field === "preferred_lot_size_min" ||
        field === "preferred_lot_size_max" ||
        field === "preferred_home_age_min" ||
        field === "preferred_home_age_max"
      ) {
        setSearchFilterOverrides({
          [field]: typeof value === "number" ? value : undefined,
        } as Partial<SearchFilterOverrides>);
      } else if (field === "preferred_housing_type") {
        setSearchFilterOverrides({
          preferred_housing_type: typeof value === "string" ? value : "",
        });
      } else if (field === "listing_type") {
        setSearchFilterOverrides({
          listing_type: Array.isArray(value) ? value.map(String) : [],
        });
      } else if (field === "must_have") {
        setSearchFilterOverrides({
          must_have: Array.isArray(value) ? value.map(String) : [],
        });
      } else if (field === "preferred_home_features") {
        setSearchFilterOverrides({
          preferred_home_features: Array.isArray(value) ? value.map(String) : [],
        });
      }
    },
    [setSearchFilterOverrides, updateFormData]
  );

  const closePopover = useCallback(() => {
    setPopoverOpen(false);
    onPopoverClose?.();
  }, [onPopoverClose]);
  useRegisterSearchHeaderPopoverWhenOpen(popoverOpen, closePopover);

  if (variant === "mobile") {
    return (
      <>
        <Box id={TOUR_TARGETS_MOBILE.preferencesControl} className="inline-flex min-w-0 shrink">
          <Button
            variant="cancel"
            size="sm"
            iconName="sliders-horizontal"
            hideTextBelow="sm"
            label={t("search.filters")}
            onClick={() => setSheetOpen(true)}
            className={`touch-friendly shrink-0 ${HEADER_ROW_CONTROL_HEIGHT}`}
            aria-expanded={sheetOpen}
            aria-haspopup="dialog"
          >
            {t("search.filters")}
          </Button>
        </Box>
        <SearchFiltersSheet
          open={sheetOpen}
          onClose={() => setSheetOpen(false)}
          formData={formData}
          updateFormData={updateSearchFormData}
          scriptsReady={scriptsReady}
          selectedClientId={selectedClientId}
          onClientChange={onClientChange}
          patchBuyerPreferenceExtensions={patchBuyerPreferenceExtensions}
          onAgentSyncPreferencesFetched={onAgentSyncPreferencesFetched}
          replaceFormData={replaceFormData}
          cancelPendingSave={cancelPendingSave}
          onAfterClear={onAfterClear}
        />
      </>
    );
  }

  return (
    <Box
      id={TOUR_TARGETS_DESKTOP.preferencesControl}
      className={`flex min-w-0 flex-nowrap items-center gap-2 ${HEADER_ROW_HEIGHT}`}
    >
      <Popover
        open={popoverOpen}
        onOpenChange={(open) => {
          if (!open) closePopover();
          else setPopoverOpen(true);
        }}
        usePortal={true}
        side="left"
        panelClassName={panelClass}
        panelMaxHeight={SEARCH_HEADER_PANEL_MAX_HEIGHT}
        panelMinWidth="420px"
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
            iconName="sliders-horizontal"
            label={t("search.more")}
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
        {() => (
          <SearchPreferencesContent
            formData={formData}
            updateFormData={updateSearchFormData}
            patchBuyerPreferenceExtensions={patchBuyerPreferenceExtensions}
            scriptsReady={scriptsReady}
            viewingClientId={selectedClientId ?? null}
            onAgentSyncPreferencesFetched={onAgentSyncPreferencesFetched}
            onClientChange={onClientChange}
            replaceFormData={replaceFormData}
            cancelPendingSave={cancelPendingSave}
            onAfterClear={onAfterClear}
          />
        )}
      </Popover>
    </Box>
  );
}
