import React, { useCallback, useState } from "react";

import { useLocalization } from "packages/contexts";
import type { PatchBuyerPreferenceExtensions } from "packages/features/profile";
import {
  SEARCH_HEADER_PANEL_CLASS_DEFAULT,
  SEARCH_HEADER_PANEL_MAX_HEIGHT,
} from "packages/features/search/components/header/searchHeaderConstants";
import { Box } from "packages/ui/components/primitives";
import { HEADER_ROW_HEIGHT } from "packages/ui/constants/layout";

import { BodyText, Button, DropdownChevron, Popover } from "@/components/ui";
import type { OnboardingData } from "@/features/profile/utils";
import SearchPreferencesContent from "@/features/search/components/filters/SearchPreferencesContent.web";

import SearchFiltersSheet from "./SearchFiltersSheet.web";

const buttonBase = `inline-flex items-center gap-1.5 rounded-lg px-4 text-sm font-medium transition-colors whitespace-nowrap shrink-0 justify-between ${HEADER_ROW_HEIGHT}`;
const panelClass = `${SEARCH_HEADER_PANEL_CLASS_DEFAULT} overflow-x-hidden w-[min(90vw,520px)]`;

export type SearchFilterBarProps = {
  formData: Partial<OnboardingData>;
  updateFormData: (field: keyof OnboardingData, value: unknown) => void;
  saveStatus?: "idle" | "saving" | "saved";
  onPopoverClose?: () => void;
  variant?: "desktop" | "mobile";
  selectedClientId?: string | null;
  onClientChange?: (clientId: string | null) => void;
  patchBuyerPreferenceExtensions: PatchBuyerPreferenceExtensions;
  scriptsReady: boolean;
};

export default function SearchFilterBar({
  formData,
  updateFormData,
  saveStatus,
  onPopoverClose,
  variant = "desktop",
  selectedClientId,
  onClientChange,
  patchBuyerPreferenceExtensions,
  scriptsReady,
}: SearchFilterBarProps): React.ReactElement {
  const { t } = useLocalization();
  const [sheetOpen, setSheetOpen] = useState(false);
  const [popoverOpen, setPopoverOpen] = useState(false);

  const handleApplyFromSheet = useCallback(() => {
    onPopoverClose?.();
    setSheetOpen(false);
  }, [onPopoverClose]);

  const closePopover = useCallback(() => {
    setPopoverOpen(false);
    onPopoverClose?.();
  }, [onPopoverClose]);

  if (variant === "mobile") {
    return (
      <>
        <Button
          variant="cancel"
          size="sm"
          iconName="sliders-horizontal"
          onClick={() => setSheetOpen(true)}
          className={`touch-friendly shrink-0 ${HEADER_ROW_HEIGHT}`}
          aria-expanded={sheetOpen}
          aria-haspopup="dialog"
        >
          {t("search.filters")}
        </Button>
        <SearchFiltersSheet
          open={sheetOpen}
          onClose={() => setSheetOpen(false)}
          onApply={handleApplyFromSheet}
          formData={formData}
          updateFormData={updateFormData}
          saveStatus={saveStatus}
          scriptsReady={scriptsReady}
          selectedClientId={selectedClientId}
          onClientChange={onClientChange}
          patchBuyerPreferenceExtensions={patchBuyerPreferenceExtensions}
        />
      </>
    );
  }

  return (
    <Box className={`flex min-w-0 flex-nowrap items-center gap-2 ${HEADER_ROW_HEIGHT}`}>
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
        {() => (
          <SearchPreferencesContent
            formData={formData}
            updateFormData={updateFormData}
            saveStatus={saveStatus}
            patchBuyerPreferenceExtensions={patchBuyerPreferenceExtensions}
            scriptsReady={scriptsReady}
          />
        )}
      </Popover>
    </Box>
  );
}
