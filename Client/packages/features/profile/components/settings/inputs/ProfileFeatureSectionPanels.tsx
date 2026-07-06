import React from "react";

import { renderProfileSectionContent } from "packages/features/profile/components/formSections/renderProfileSectionContent";
import { PersonalizationSectionPanel } from "packages/features/profile/components/layout";
import { AgentPublicProfileShareRow } from "packages/features/profile/components/profileScreen/tabs/privacy/AgentPublicProfileShareRow";
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
  /** From preferences; enables `/a/{slug}` in the share row. */
  agentPublicProfileSlug?: string | null;
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
  showAvailabilityEditor: boolean;
};

export function ProfileFeatureSectionPanels({
  agentSubject,
  isUltraSmallScreen,
  showAgentPublicProfileShare,
  agentPublicProfileUserId,
  agentPublicProfileDisplayName,
  agentPublicProfileSlug,
  steps,
  formData,
  isEditMode,
  updateFormData,
  patchBuyerPreferenceExtensions,
  scriptsReady,
  loadError,
  showAvailabilityEditor,
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
          publicProfileSlug={agentPublicProfileSlug}
        />
      ) : null}
      {steps.map((step) => (
        <PersonalizationSectionPanel
          key={step.id}
          sectionId={step.id}
          screenReaderHeading={step.title}
          showVisibleHeading={step.id !== "location"}
        >
          {renderProfileSectionContent({
            sectionId: step.id,
            surface: "settings",
            formData,
            isEditMode: effectiveEditMode,
            updateField: updateFormData,
            patchBuyerPreferenceExtensions,
            scriptsReady,
            loadError,
            agentSubject,
            showAvailabilityEditor,
          })}
        </PersonalizationSectionPanel>
      ))}
    </main>
  );
}
