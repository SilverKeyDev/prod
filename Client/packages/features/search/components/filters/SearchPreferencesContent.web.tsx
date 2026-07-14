import React from "react";

import { useLocalization } from "packages/contexts";
import type { OnboardingData } from "packages/features/profile";
import {
  LocationSection,
  type PatchBuyerPreferenceExtensions,
  PreferencesSaveStatusRow,
  ProfileHousingEssentialsSection,
  ProfileHousingRangesSection,
  ProfileSearchPropertySection,
} from "packages/features/profile";
import { SearchDisplayPanelWeb } from "packages/features/search/components/header/display/SearchDisplayPanel.web";
import { useIsAgent } from "packages/hooks/store";
import { Box } from "packages/ui/components/structure/primitives";

import { Title } from "@/components/ui";
import AgentSearchPreferencesSyncPanel from "@/features/agent/components/search/AgentSearchPreferencesSyncPanel.web";

import { ClearPreferencesButton } from "./ClearPreferencesButton";
import PriceRangeFilter from "./PriceRangeFilter.web";
import { SearchStrictPreferencesControlWeb } from "./SearchStrictPreferencesControl.web";

export type SearchPreferencesContentProps = {
  formData: Partial<OnboardingData>;
  updateFormData: (field: keyof OnboardingData, value: unknown) => void;
  updateFormFields: (patch: Partial<OnboardingData>) => void;
  patchBuyerPreferenceExtensions: PatchBuyerPreferenceExtensions;
  scriptsReady: boolean;
  /** When an agent is viewing a client in Search, show copy that edits apply to the agent only. */
  viewingClientId?: string | null;
  /**
   * When the agent uses “Match my preferences to a client” while viewing their own profile (not a client),
   * called immediately after client prefs load so the form can snap to those values before POST finishes.
   */
  onAgentSyncPreferencesFetched?: (onboarding: Partial<OnboardingData>) => void;
  onClientChange?: (clientId: string | null) => void;
  replaceFormData?: (next: Partial<OnboardingData>) => void;
  cancelPendingSave?: () => void;
  onAfterClear?: () => void | Promise<void>;
  registerOutsideClickSafeTarget?: (element: HTMLElement) => () => void;
  menuPortalStack?: "page" | "modal";
  saveStatus?: "idle" | "saving" | "saved";
};

export default function SearchPreferencesContent({
  formData,
  updateFormData,
  updateFormFields,
  patchBuyerPreferenceExtensions,
  scriptsReady,
  viewingClientId = null,
  onAgentSyncPreferencesFetched,
  onClientChange,
  replaceFormData,
  cancelPendingSave,
  onAfterClear,
  registerOutsideClickSafeTarget,
  menuPortalStack = "page",
  saveStatus = "idle",
}: SearchPreferencesContentProps): React.ReactElement {
  const { t } = useLocalization();
  const typedFormData = formData as OnboardingData;
  const isAgent = useIsAgent();

  return (
    <Box className="space-y-6">
      <PreferencesSaveStatusRow
        saveStatus={saveStatus}
        savingLabel={t("common.saving")}
        savedLabel={t("common.saved")}
        className="bg-background-surface z-header sticky top-0 min-h-5 pb-1"
      />

      <ClearPreferencesButton
        selectedClientId={viewingClientId}
        onClientChange={onClientChange}
        replaceFormData={replaceFormData}
        cancelPendingSave={cancelPendingSave}
        onAfterClear={onAfterClear}
        className="border-border w-full border-b pb-4"
      />

      {isAgent ? (
        <AgentSearchPreferencesSyncPanel
          viewingClientId={viewingClientId}
          onAgentSyncPreferencesFetched={onAgentSyncPreferencesFetched}
        />
      ) : null}

      <PriceRangeFilter
        minValue={formData.home_budget_min ?? 0}
        maxValue={formData.home_budget_max ?? 2_000_000}
        onChange={(minVal, maxVal) => {
          updateFormFields({
            home_budget_min: minVal,
            home_budget_max: maxVal,
          });
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

      <SearchStrictPreferencesControlWeb />

      <Box className="border-border mt-6 border-t pt-6">
        <Title size="sm" as="h3" className="mb-4">
          {t("search.display")}
        </Title>
        <SearchDisplayPanelWeb
          registerOutsideClickSafeTarget={registerOutsideClickSafeTarget}
          menuPortalStack={menuPortalStack}
        />
      </Box>
    </Box>
  );
}
