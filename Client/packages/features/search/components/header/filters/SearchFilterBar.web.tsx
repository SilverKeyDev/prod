import React, { useCallback, useState } from "react";

import { useLocalization } from "packages/contexts";
import type { PatchBuyerPreferenceExtensions } from "packages/features/profile";
import {
  SEARCH_HEADER_PANEL_CLASS_DEFAULT,
  SEARCH_HEADER_PANEL_MAX_HEIGHT,
} from "packages/features/search/components/header/searchHeaderConstants";
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
  saveStatus?: "idle" | "saving" | "saved";
  flushPreferencesSave: () => Promise<void>;
  onPreferencesApplySearch?: () => void | Promise<void>;
  isSearching?: boolean;
  onPopoverClose?: () => void;
  variant?: "desktop" | "mobile";
  selectedClientId?: string | null;
  onClientChange?: (clientId: string | null) => void;
  patchBuyerPreferenceExtensions: PatchBuyerPreferenceExtensions;
  scriptsReady: boolean;
  onAgentSyncPreferencesFetched?: (onboarding: Partial<OnboardingData>) => void;
};

export default function SearchFilterBar({
  formData,
  updateFormData,
  saveStatus,
  flushPreferencesSave,
  onPreferencesApplySearch,
  isSearching = false,
  onPopoverClose,
  variant = "desktop",
  selectedClientId,
  onClientChange,
  patchBuyerPreferenceExtensions,
  scriptsReady,
  onAgentSyncPreferencesFetched,
}: SearchFilterBarProps): React.ReactElement {
  const { t } = useLocalization();
  const [sheetOpen, setSheetOpen] = useState(false);
  const [popoverOpen, setPopoverOpen] = useState(false);
  const [applyBusy, setApplyBusy] = useState(false);

  const runApplyThenSearch = useCallback(async () => {
    if (isSearching || applyBusy) return;
    setApplyBusy(true);
    try {
      await flushPreferencesSave();
      await onPreferencesApplySearch?.();
    } finally {
      setApplyBusy(false);
    }
  }, [applyBusy, flushPreferencesSave, isSearching, onPreferencesApplySearch]);

  const handleApplyFromSheet = useCallback(async () => {
    await runApplyThenSearch();
    onPopoverClose?.();
  }, [onPopoverClose, runApplyThenSearch]);

  const closePopover = useCallback(() => {
    setPopoverOpen(false);
    onPopoverClose?.();
  }, [onPopoverClose]);

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
          onApply={handleApplyFromSheet}
          formData={formData}
          updateFormData={updateFormData}
          saveStatus={saveStatus}
          scriptsReady={scriptsReady}
          selectedClientId={selectedClientId}
          onClientChange={onClientChange}
          patchBuyerPreferenceExtensions={patchBuyerPreferenceExtensions}
          onAgentSyncPreferencesFetched={onAgentSyncPreferencesFetched}
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
          <>
            <SearchPreferencesContent
              formData={formData}
              updateFormData={updateFormData}
              saveStatus={saveStatus}
              patchBuyerPreferenceExtensions={patchBuyerPreferenceExtensions}
              scriptsReady={scriptsReady}
              viewingClientId={selectedClientId ?? null}
              onAgentSyncPreferencesFetched={onAgentSyncPreferencesFetched}
            />
            <Box className="border-border bg-background-surface z-dropdown sticky bottom-0 -mx-4 -mb-4 mt-4 border-t px-4 py-3">
              <Button
                type="button"
                variant="primary"
                size="md"
                fullWidth
                loading={applyBusy || saveStatus === "saving"}
                disabled={isSearching || applyBusy}
                onClick={() => {
                  void (async () => {
                    try {
                      await runApplyThenSearch();
                    } catch {
                      /* save errors handled in preferences layer */
                    } finally {
                      // Controlled popover: sync local open state (onClose alone can miss after await).
                      closePopover();
                    }
                  })();
                }}
                className="touch-friendly"
                iconName="search"
              >
                {t("search.apply")}
              </Button>
            </Box>
          </>
        )}
      </Popover>
    </Box>
  );
}
