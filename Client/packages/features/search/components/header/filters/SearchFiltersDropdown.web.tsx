import React, { useEffect, useRef } from "react";

import { type PreferencesFormActionsRef, PreferencesFormContent } from "packages/features/profile";
import { useSearchContextStore } from "packages/store";

import SearchFilterBar from "./SearchFilterBar.web";

type SearchFiltersDropdownProps = {
  variant?: "desktop" | "mobile";
  selectedClientId?: string | null;
  onClientChange?: (clientId: string | null) => void;
};

type FlushPreferencesSaveRegistrarProps = {
  flushPreferencesSave: () => Promise<void>;
  children: React.ReactNode;
};

/**
 * Agents may select a client to load that client's preferences for search context.
 * All edits in this dropdown still POST to the signed-in user's profile only.
 */
function FlushPreferencesSaveRegistrar({
  flushPreferencesSave,
  children,
}: FlushPreferencesSaveRegistrarProps): React.ReactElement {
  const setFlushPreferencesSave = useSearchContextStore((s) => s.setFlushPreferencesSave);

  useEffect(() => {
    setFlushPreferencesSave(() => flushPreferencesSave);
    return () => {
      setFlushPreferencesSave(null);
    };
  }, [flushPreferencesSave, setFlushPreferencesSave]);

  return <>{children}</>;
}

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
        flushPreferencesSave,
        saveStatus,
      }) => (
        <FlushPreferencesSaveRegistrar flushPreferencesSave={flushPreferencesSave}>
          <SearchFilterBar
            formData={formData}
            updateFormData={updateFormData}
            variant={variant}
            selectedClientId={selectedClientId}
            onClientChange={onClientChange}
            patchBuyerPreferenceExtensions={patchBuyerPreferenceExtensions}
            scriptsReady={scriptsReady}
            saveStatus={saveStatus}
            onAgentSyncPreferencesFetched={(onboarding) =>
              preferencesFormActionsRef.current?.replaceFormData(onboarding)
            }
            replaceFormData={(next) => preferencesFormActionsRef.current?.replaceFormData(next)}
            cancelPendingSave={cancelPendingSave}
          />
        </FlushPreferencesSaveRegistrar>
      )}
    />
  );
}
