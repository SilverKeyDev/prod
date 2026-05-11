import React, { useRef } from "react";

import PreferencesFormContent, {
  type PreferencesFormActionsRef,
} from "@/features/profile/components/settings/inputs/PreferencesFormContent.web";

import SearchFilterBar from "./SearchFilterBar.web";

type SearchFiltersDropdownProps = {
  variant?: "desktop" | "mobile";
  selectedClientId?: string | null;
  onClientChange?: (clientId: string | null) => void;
  onPreferencesApplySearch?: () => void | Promise<void>;
  isSearching?: boolean;
};

export default function SearchFiltersDropdown({
  variant = "desktop",
  selectedClientId,
  onClientChange,
  onPreferencesApplySearch,
  isSearching = false,
}: SearchFiltersDropdownProps): React.ReactElement {
  const preferencesFormActionsRef = useRef<PreferencesFormActionsRef | null>(null);
  return (
    <PreferencesFormContent
      showErrorToastOnError={false}
      preferencesSubjectUserId={selectedClientId ?? null}
      preferencesFormActionsRef={preferencesFormActionsRef}
      renderContent={({
        formData,
        updateFormData,
        saveStatus,
        patchBuyerPreferenceExtensions,
        scriptsReady,
        flushPreferencesSave,
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
          flushPreferencesSave={flushPreferencesSave}
          onPreferencesApplySearch={onPreferencesApplySearch}
          isSearching={isSearching}
          onAgentSyncPreferencesFetched={(onboarding) =>
            preferencesFormActionsRef.current?.replaceFormData(onboarding)
          }
        />
      )}
    />
  );
}
