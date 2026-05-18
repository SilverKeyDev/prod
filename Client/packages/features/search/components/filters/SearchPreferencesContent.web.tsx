import React from "react";

import {
  LocationSection,
  type PatchBuyerPreferenceExtensions,
  ProfileHousingEssentialsSection,
  ProfileHousingRangesSection,
  ProfileSearchPropertySection,
} from "packages/features/profile";
import { useIsAgent } from "packages/hooks/store";
import { Box } from "packages/ui/components/primitives";

import AgentSearchPreferencesSyncPanel from "@/features/agent/components/search/AgentSearchPreferencesSyncPanel.web";
import type { OnboardingData } from "@/features/profile/utils";

import PriceRangeFilter from "./PriceRangeFilter.web";

export type SearchPreferencesContentProps = {
  formData: Partial<OnboardingData>;
  updateFormData: (field: keyof OnboardingData, value: unknown) => void;
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
  patchBuyerPreferenceExtensions,
  scriptsReady,
  viewingClientId = null,
  onAgentSyncPreferencesFetched,
}: SearchPreferencesContentProps): React.ReactElement {
  const typedFormData = formData as OnboardingData;
  const isAgent = useIsAgent();

  return (
    <Box className="space-y-6">
      {isAgent ? (
        <AgentSearchPreferencesSyncPanel
          viewingClientId={viewingClientId}
          onAgentSyncPreferencesFetched={onAgentSyncPreferencesFetched}
        />
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
