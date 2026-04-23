import React, { useState } from "react";

import BodyText from "@ui/text/BodyText";

import { useLocalization } from "packages/contexts";
import {
  LocationSection,
  type PatchBuyerPreferenceExtensions,
  ProfileHousingEssentialsSection,
  ProfileHousingRangesSection,
  ProfileSearchPropertySection,
} from "packages/features/profile";
import { useSyncAgentPreferencesFromClient } from "packages/features/search/hooks/data/useSyncAgentPreferencesFromClient";
import { useIsAgent } from "packages/hooks/store";
import ClientSelector from "packages/ui/components/button/ClientSelector";
import { Box } from "packages/ui/components/primitives";

import { useAgentClients } from "@/features/agent/hooks/data/useAgentClients";
import PreferencesSaveStatusRow from "@/features/profile/components/settings/inputs/PreferencesSaveStatusRow";
import type { OnboardingData } from "@/features/profile/utils";

import PriceRangeFilter from "./PriceRangeFilter.web";

export type SearchPreferencesContentProps = {
  formData: Partial<OnboardingData>;
  updateFormData: (field: keyof OnboardingData, value: unknown) => void;
  saveStatus?: "idle" | "saving" | "saved";
  patchBuyerPreferenceExtensions: PatchBuyerPreferenceExtensions;
  scriptsReady: boolean;
  /** When an agent is viewing a client in Search, show copy that edits apply to the agent only. */
  viewingClientId?: string | null;
  /**
   * When the agent uses “Match my preferences to a client” while viewing their own profile (not a client),
   * called immediately after client prefs load so the form can snap to those values before POST finishes.
   */
  onAgentSyncPreferencesFetched?: (onboarding: Partial<OnboardingData>) => void;
};

export default function SearchPreferencesContent({
  formData,
  updateFormData,
  saveStatus = "idle",
  patchBuyerPreferenceExtensions,
  scriptsReady,
  viewingClientId = null,
  onAgentSyncPreferencesFetched,
}: SearchPreferencesContentProps): React.ReactElement {
  const { t } = useLocalization();
  const typedFormData = formData as OnboardingData;
  const isAgent = useIsAgent();
  const showAgentClientViewNote = isAgent && viewingClientId != null && viewingClientId !== "";
  const { clients } = useAgentClients();
  const { syncFromClient, isSyncing } = useSyncAgentPreferencesFromClient();
  const [syncPickerClientId, setSyncPickerClientId] = useState<string | null>(null);

  const handleAgentSyncClientChange = (clientId: string | null) => {
    if (clientId === null) {
      setSyncPickerClientId(null);
      return;
    }
    setSyncPickerClientId(clientId);
    const client = clients.find((c) => c.id === clientId);
    const displayName = client?.name?.trim() || client?.email?.trim() || undefined;
    const viewingClient = viewingClientId != null && viewingClientId !== "";
    void syncFromClient(clientId, displayName, {
      onFetched: (onboarding) => {
        // When viewing a client’s prefs, keep showing that client’s data; preview applies to self-view only.
        if (!viewingClient) {
          onAgentSyncPreferencesFetched?.(onboarding);
        }
      },
    });
  };

  return (
    <Box className="space-y-6">
      <PreferencesSaveStatusRow
        saveStatus={saveStatus}
        savingLabel={t("common.saving")}
        savedLabel={t("common.saved")}
        className="flex items-center gap-2 text-sm"
      />

      {showAgentClientViewNote ? (
        <BodyText as="p" size="sm" className="text-text-secondary">
          {t("search.agent_filter_edits_save_to_your_profile")}
        </BodyText>
      ) : null}

      {isAgent ? (
        <Box className="space-y-2">
          <BodyText as="p" size="sm" className="text-text-primary font-medium">
            {t("search.agent_sync_preferences_label")}
          </BodyText>
          <BodyText as="p" size="sm" className="text-text-secondary">
            {t("search.agent_sync_preferences_hint")}
          </BodyText>
          <Box className={isSyncing ? "pointer-events-none opacity-60" : undefined}>
            <ClientSelector
              selectedClientId={syncPickerClientId}
              onClientChange={handleAgentSyncClientChange}
              hideMeOption
              className="max-w-full"
            />
          </Box>
        </Box>
      ) : null}

      <PriceRangeFilter
        minValue={formData.home_budget_min ?? 100_000}
        maxValue={formData.home_budget_max ?? 2_000_000}
        onChange={(minVal, maxVal) => {
          updateFormData("home_budget_min", minVal);
          updateFormData("home_budget_max", maxVal);
        }}
      />

      <ProfileHousingEssentialsSection
        formData={typedFormData}
        isEditMode={true}
        updateField={updateFormData}
      />

      <ProfileHousingRangesSection
        formData={typedFormData}
        isEditMode={true}
        updateField={updateFormData}
      />

      <LocationSection
        formData={typedFormData}
        isEditMode={true}
        updateFormData={updateFormData}
        scriptsReady={scriptsReady}
        patchBuyerPreferenceExtensions={patchBuyerPreferenceExtensions}
      />

      <ProfileSearchPropertySection
        formData={typedFormData}
        isEditMode={true}
        updateField={updateFormData}
        patchBuyerPreferenceExtensions={patchBuyerPreferenceExtensions}
      />
    </Box>
  );
}
