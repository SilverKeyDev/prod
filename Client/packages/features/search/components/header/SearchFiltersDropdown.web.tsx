import React, { useCallback, useRef } from "react";

import { showErrorToast } from "packages/hooks/ui/toast/useToast";

import PreferencesFormContent, {
  type PreferencesFormContentRef,
} from "@/features/profile/components/settings/inputs/PreferencesFormContent.web";
import type { OnboardingData } from "@/features/profile/utils";

import SearchFilterBar from "./SearchFilterBar.web";

type SearchFiltersDropdownProps = {
  onPreferencesChanged?: () => void | Promise<void>;
  variant?: "desktop" | "mobile";
};

export default function SearchFiltersDropdown({
  onPreferencesChanged,
  variant = "desktop",
}: SearchFiltersDropdownProps): React.ReactElement {
  const formContentRef = useRef<PreferencesFormContentRef | null>(null);
  const initialFormDataRef = useRef<string>("");

  const handleInitialSnapshot = useCallback((formData: Partial<OnboardingData>) => {
    initialFormDataRef.current = JSON.stringify(formData);
  }, []);

  const handlePopoverClose = useCallback(() => {
    const current = formContentRef.current;
    if (current?.preventedDeleteWarning) {
      showErrorToast(
        "You must have at least one important location. Your last location was kept and not deleted."
      );
    }
    // Do not trigger search on popover close; search runs only when user clicks Search.
  }, []);

  return (
    <PreferencesFormContent
      formContentRef={formContentRef}
      showErrorToastOnError={false}
      onInitialSnapshot={handleInitialSnapshot}
      onPreferencesSaved={undefined}
      renderContent={({ formData, updateFormData, saveStatus }) => (
        <SearchFilterBar
          formData={formData}
          updateFormData={updateFormData}
          saveStatus={saveStatus}
          onPreferencesChanged={onPreferencesChanged}
          onPopoverClose={handlePopoverClose}
          variant={variant}
        />
      )}
    />
  );
}
