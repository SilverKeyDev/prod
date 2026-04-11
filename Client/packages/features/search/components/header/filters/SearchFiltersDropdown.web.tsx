import React, { useCallback, useRef } from "react";

import { showErrorToast } from "packages/hooks/ui/toast/useToast";

import PreferencesFormContent, {
  type PreferencesFormContentRef,
} from "@/features/profile/components/settings/inputs/PreferencesFormContent.web";
import type { OnboardingData } from "@/features/profile/utils";

import SearchFilterBar from "./SearchFilterBar.web";

type SearchFiltersDropdownProps = {
  variant?: "desktop" | "mobile";
  selectedClientId?: string | null;
  onClientChange?: (clientId: string | null) => void;
};

export default function SearchFiltersDropdown({
  variant = "desktop",
  selectedClientId,
  onClientChange,
}: SearchFiltersDropdownProps): React.ReactElement {
  const formContentRef = useRef<PreferencesFormContentRef | null>(null);
  const initialFormDataRef = useRef<string>("");
  const lastImportantLocationsJsonRef = useRef<string | null>(null);

  const handleInitialSnapshot = useCallback(
    (formData: Partial<OnboardingData>) => {
      initialFormDataRef.current = JSON.stringify(formData);
      lastImportantLocationsJsonRef.current = JSON.stringify(
        formData.important_locations ?? [],
      );
    },
    [],
  );

  const handlePreferencesSaved = useCallback(async () => {
    const locs = formContentRef.current?.formData?.important_locations;
    lastImportantLocationsJsonRef.current = JSON.stringify(locs ?? []);
  }, []);

  const handlePopoverClose = useCallback(() => {
    const current = formContentRef.current;
    if (current?.preventedDeleteWarning) {
      showErrorToast(
        "You must have at least one important location. Your last location was kept and not deleted.",
      );
    }
    // Do not trigger search on popover close; search runs only when user clicks Search.
  }, []);

  return (
    <PreferencesFormContent
      formContentRef={formContentRef}
      showErrorToastOnError={false}
      onInitialSnapshot={handleInitialSnapshot}
      onPreferencesSaved={handlePreferencesSaved}
      preferencesSubjectUserId={selectedClientId ?? null}
      renderContent={({
        formData,
        updateFormData,
        saveStatus,
        patchBuyerPreferenceExtensions,
        scriptsReady,
      }) => (
        <SearchFilterBar
          formData={formData}
          updateFormData={updateFormData}
          saveStatus={saveStatus}
          onPopoverClose={handlePopoverClose}
          variant={variant}
          selectedClientId={selectedClientId}
          onClientChange={onClientChange}
          patchBuyerPreferenceExtensions={patchBuyerPreferenceExtensions}
          scriptsReady={scriptsReady}
        />
      )}
    />
  );
}
