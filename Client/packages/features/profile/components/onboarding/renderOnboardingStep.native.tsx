import React from "react";

import { ProfileSearchPropertySection } from "packages/features/profile/components/profileScreen/sections/search/ProfileSearchPropertySection";
import {
  AgentBrokerageSection,
  AgentLicensingSection,
  AgentProfileServiceSection,
} from "packages/features/profile/components/sections";
import { Box } from "packages/ui/components/primitives";
import { Text } from "packages/ui/components/primitives";

import { DemographicsStep } from "./DemographicsStep.native";
import { HousingStepEssentials } from "./housing/HousingStepEssentials.native";
import { HousingStepRanges } from "./housing/HousingStepRanges.native";
import { LocationStep } from "./LocationStep.native";
import { OnboardingRoleStep } from "./OnboardingRoleStep.native";
import type { RenderOnboardingStepProps } from "./renderOnboardingStep.types";

export function renderOnboardingStep({
  stepId,
  formData,
  updateFormData,
  patchBuyerPreferenceExtensions,
}: RenderOnboardingStepProps): React.ReactNode {
  switch (stepId) {
    case "onboarding_role":
      return <OnboardingRoleStep formData={formData} updateFormData={updateFormData} />;
    case "demographics":
      return <DemographicsStep formData={formData} updateFormData={updateFormData} />;
    case "agent_brokerage":
      return (
        <AgentBrokerageSection
          formData={formData}
          isEditMode={true}
          updateFormData={updateFormData}
          wrapInCard={false}
        />
      );
    case "agent_licensing":
      return (
        <AgentLicensingSection
          formData={formData}
          isEditMode={true}
          updateFormData={updateFormData}
          wrapInCard={false}
        />
      );
    case "agent_profile":
      return (
        <AgentProfileServiceSection
          formData={formData}
          isEditMode={true}
          updateFormData={updateFormData}
          wrapInCard={false}
        />
      );
    case "housing_essentials":
      return <HousingStepEssentials formData={formData} updateFormData={updateFormData} />;
    case "housing_ranges":
      return <HousingStepRanges formData={formData} updateFormData={updateFormData} />;
    case "location":
      return (
        <LocationStep
          formData={formData}
          updateFormData={updateFormData}
          patchBuyerPreferenceExtensions={patchBuyerPreferenceExtensions}
        />
      );
    case "search_property":
      return (
        <ProfileSearchPropertySection
          formData={formData}
          isEditMode={true}
          updateField={(field, value) => updateFormData(field, value)}
          patchBuyerPreferenceExtensions={patchBuyerPreferenceExtensions}
        />
      );
    default:
      return (
        <Box className="py-6">
          <Text className="text-text-primary mb-2 text-center text-lg font-semibold">
            Complete your profile
          </Text>
          <Text className="text-text-secondary text-center text-sm">
            Use the buttons below to continue or go back to another step.
          </Text>
        </Box>
      );
  }
}
