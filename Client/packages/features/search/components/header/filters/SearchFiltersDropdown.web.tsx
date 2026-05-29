import React, { useRef } from "react";

import PreferencesFormContent, {
  type PreferencesFormActionsRef,
} from "@/features/profile/components/settings/inputs/PreferencesFormContent.web";

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
  const preferencesFormActionsRef = useRef<PreferencesFormActionsRef | null>(null);
  return (
    <PreferencesFormContent
      showErrorToastOnError={false}
      preferencesSubjectUserId={selectedClientId ?? null}
      preferencesFormActionsRef={preferencesFormActionsRef}
      renderContent={({
        formData,
        updateFormData,
        patchBuyerPreferenceExtensions,
        scriptsReady,
        cancelPendingSave,
      }) => (
        <SearchFilterBar
          formData={formData}
          updateFormData={updateFormData}
          variant={variant}
          selectedClientId={selectedClientId}
          onClientChange={onClientChange}
          patchBuyerPreferenceExtensions={patchBuyerPreferenceExtensions}
          scriptsReady={scriptsReady}
          onAgentSyncPreferencesFetched={(onboarding) =>
            preferencesFormActionsRef.current?.replaceFormData(onboarding)
          }
          replaceFormData={(next) => preferencesFormActionsRef.current?.replaceFormData(next)}
          cancelPendingSave={cancelPendingSave}
        />
      )}
    />
  );
}
