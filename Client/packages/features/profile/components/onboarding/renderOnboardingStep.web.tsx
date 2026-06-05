import React from "react";

import { Box } from "packages/ui/components/structure/primitives";

import { BodyText, Title } from "@/components/ui";
import { BrokerageShellSetupStep } from "@/features/brokerage/components/onboarding/BrokerageShellSetupStep.web";
import { IntegrationPartnerShellSetupStep } from "@/features/integrationPartner/components/onboarding/IntegrationPartnerShellSetupStep.web";
import OnboardingRoleStep from "@/features/profile/components/onboarding/OnboardingRoleStep.web";
import { ProfileHousingEssentialsSection } from "@/features/profile/components/profileScreen/sections/housing/ProfileHousingEssentialsSection";
import { ProfileHousingRangesSection } from "@/features/profile/components/profileScreen/sections/housing/ProfileHousingRangesSection";
import { ProfileSearchPropertySection } from "@/features/profile/components/profileScreen/sections/search/ProfileSearchPropertySection";
import {
  AgentBrokerageSection,
  AgentLicensingSection,
  AgentProfileServiceSection,
  DemographicsSection,
  LocationSection,
} from "@/features/profile/components/sections/index.web";
import { SellerShellSetupStep } from "@/features/seller/components/onboarding/SellerShellSetupStep.web";

import type { RenderOnboardingStepProps } from "./renderOnboardingStep.types";

export function renderOnboardingStep({
  stepId,
  formData,
  updateFormData,
  patchBuyerPreferenceExtensions,
  scriptsReady,
  loadError,
}: RenderOnboardingStepProps): React.ReactNode {
  switch (stepId) {
    case "onboarding_role":
      return <OnboardingRoleStep formData={formData} updateFormData={updateFormData} />;

    case "demographics":
      return (
        <DemographicsSection
          formData={formData}
          isEditMode={true}
          updateFormData={updateFormData}
          wrapInCard={false}
          hideProfilePictureWhenOnboarding={true}
          hideNameWhenOnboarding={true}
          showWhyJoiningQuestion={false}
        />
      );

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
      return (
        <ProfileHousingEssentialsSection
          formData={formData}
          isEditMode={true}
          updateField={(field, value) => updateFormData(field, value)}
        />
      );

    case "housing_ranges":
      return (
        <ProfileHousingRangesSection
          formData={formData}
          isEditMode={true}
          updateField={(field, value) => updateFormData(field, value)}
        />
      );

    case "location":
      return (
        <LocationSection
          formData={formData}
          isEditMode={true}
          updateFormData={updateFormData}
          scriptsReady={scriptsReady}
          loadError={loadError}
          wrapInCard={false}
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

    case "seller_shell_setup":
      return <SellerShellSetupStep formData={formData} updateFormData={updateFormData} />;

    case "brokerage_shell_setup":
      return <BrokerageShellSetupStep formData={formData} updateFormData={updateFormData} />;

    case "integration_partner_shell_setup":
      return (
        <IntegrationPartnerShellSetupStep formData={formData} updateFormData={updateFormData} />
      );

    default:
      return (
        <Box className="py-8 text-center">
          <Title as="h2" size="md" className="text-text-primary mb-2">
            Complete your profile
          </Title>
          <BodyText size="sm" muted className="mx-auto max-w-md">
            Use the buttons below to continue or go back to another step.
          </BodyText>
        </Box>
      );
  }
}
