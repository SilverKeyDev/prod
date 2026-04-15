import React from "react";

import PreferencesFormContent from "@/features/profile/components/settings/inputs/PreferencesFormContent.web";

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
  return (
    <PreferencesFormContent
      showErrorToastOnError={false}
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
