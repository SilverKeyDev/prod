import React from "react";

import { PersonalizationSectionPanel } from "packages/features/profile/components/layout";
import { AgentPublicProfileShareRow } from "packages/features/profile/components/profileScreen/sections/AgentPublicProfileShareRow";
import { renderProfileFeatureSectionContent } from "packages/features/profile/components/settings/profileFeatureSectionContent";
import type { OnboardingData } from "packages/features/profile/utils";

import type { ProfileAgentSubject } from "./profileFeatureTypes";

type Step = {
  id: string;
  title: string;
};

export type ProfileFeatureSectionPanelsProps = {
  agentSubject: ProfileAgentSubject | null | undefined;
  isUltraSmallScreen: boolean;
  showAgentPublicProfileShare: boolean;
  agentPublicProfileUserId: string;
  agentPublicProfileDisplayName: string | null;
  steps: readonly Step[];
  formData: OnboardingData;
  isEditMode: boolean;
  updateFormData: (field: keyof OnboardingData, value: unknown) => void;
  patchBuyerPreferenceExtensions: (
    fn: (
      prev: OnboardingData["buyerPreferenceExtensions"]
    ) => NonNullable<OnboardingData["buyerPreferenceExtensions"]>
  ) => void;
  scriptsReady: boolean;
  loadError: string | null;
};

export function ProfileFeatureSectionPanels({
  agentSubject,
  isUltraSmallScreen,
  showAgentPublicProfileShare,
  agentPublicProfileUserId,
  agentPublicProfileDisplayName,
  steps,
  formData,
  isEditMode,
  updateFormData,
  patchBuyerPreferenceExtensions,
  scriptsReady,
  loadError,
}: ProfileFeatureSectionPanelsProps) {
  const effectiveEditMode = agentSubject != null ? false : isEditMode;

  return (
    <main
      className={`w-full flex-1 space-y-8 ${
        agentSubject != null ? "" : !isUltraSmallScreen ? "lg:ml-0" : ""
      }`}
    >
      {showAgentPublicProfileShare ? (
        <AgentPublicProfileShareRow
          agentId={agentPublicProfileUserId}
          displayName={agentPublicProfileDisplayName}
        />
      ) : null}
      {steps.map((step) => (
        <PersonalizationSectionPanel
          key={step.id}
          sectionId={step.id}
          screenReaderHeading={step.title}
          showVisibleHeading={step.id !== "location"}
        >
          {renderProfileFeatureSectionContent({
            sectionId: step.id,
            formData,
            isEditMode: effectiveEditMode,
            updateFormData,
            patchBuyerPreferenceExtensions,
            scriptsReady,
            loadError,
            agentSubject,
          })}
        </PersonalizationSectionPanel>
      ))}
    </main>
  );
}
