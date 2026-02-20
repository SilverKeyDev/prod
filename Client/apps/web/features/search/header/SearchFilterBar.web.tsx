import React, { useCallback, useState } from "react";

import { useLocalization } from "packages/contexts";
import type { OnboardingData } from "packages/utils/domain/profile";

import { Button } from "@/components/ui/index.web";

import SearchFilterControls from "./SearchFilterControls.web";
import SearchFiltersSheet from "./SearchFiltersSheet.web";

export type SearchFilterBarProps = {
  formData: Partial<OnboardingData>;
  updateFormData: (field: string | number | symbol, value: unknown) => void;
  saveStatus?: "idle" | "saving" | "saved";
  onPreferencesChanged?: () => void | Promise<void>;
  /** Called when the More popover is closed (desktop) or when Apply is tapped in the sheet (mobile) */
  onPopoverClose?: () => void;
  variant?: "desktop" | "mobile";
};

export default function SearchFilterBar({
  formData,
  updateFormData,
  saveStatus,
  onPopoverClose,
  variant = "desktop",
}: SearchFilterBarProps): React.ReactElement {
  const { t } = useLocalization();
  const [sheetOpen, setSheetOpen] = useState(false);

  const handleApplyFromSheet = useCallback(() => {
    onPopoverClose?.();
    setSheetOpen(false);
  }, [onPopoverClose]);

  if (variant === "mobile") {
    return (
      <>
        <Button
          variant="cancel"
          size="sm"
          iconName="sliders-horizontal"
          onClick={() => setSheetOpen(true)}
          className="touch-friendly h-11 shrink-0"
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
        />
      </>
    );
  }

  return (
    <SearchFilterControls
      formData={formData}
      updateFormData={updateFormData}
      saveStatus={saveStatus}
      onPopoverClose={onPopoverClose}
      variant="desktop"
    />
  );
}
