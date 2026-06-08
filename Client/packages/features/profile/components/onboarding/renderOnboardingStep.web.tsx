import React from "react";

import { BROKERAGE_TRANSLATIONS } from "packages/features/brokerage/types/translations";
import { INTEGRATION_PARTNER_TRANSLATIONS } from "packages/features/integrationPartner/types/translations";
import {
  AgentBrokerageSection,
  AgentLicensingSection,
  AgentProfileServiceSection,
  DemographicsSection,
  LocationSection,
} from "packages/features/profile/components/formSections/index.web";
import {
  BuyerAboutMeStepContent,
  BuyerFinancingStepContent,
} from "packages/features/profile/components/onboarding/buyer";
import OnboardingRoleStep from "packages/features/profile/components/onboarding/OnboardingRoleStep.web";
import { ProfileHousingEssentialsSection } from "packages/features/profile/components/profileScreen/tabs/housing/ProfileHousingEssentialsSection";
import { ProfileHousingRangesSection } from "packages/features/profile/components/profileScreen/tabs/housing/ProfileHousingRangesSection";
import { ProfileSearchPropertySection } from "packages/features/profile/components/profileScreen/tabs/search/ProfileSearchPropertySection";
import { shouldShowBuyerOnboardingUi } from "packages/features/profile/utils/onboarding/role/onboardingRoleSelection";
import { RENTER_TRANSLATIONS } from "packages/features/renter/types/translations";
import { SELLER_TRANSLATIONS } from "packages/features/seller/types/translations";
import { WorkspaceShellSetupStep } from "packages/features/workspace/components/onboarding/WorkspaceShellSetupStep.web";
import { Box } from "packages/ui/components/structure/primitives";
import { resolveIdealZipCode } from "packages/utils/product/domain/profile/resolveIdealZipCode";

import { BodyText, Title } from "@/components/ui";

import type { RenderOnboardingStepProps } from "./renderOnboardingStep.types";

export function renderOnboardingStep({
  stepId,
  formData,
  updateFormData,
  patchBuyerPreferenceExtensions,
  scriptsReady,
  loadError,
  homePriceLoading,
  homePriceError,
  homePriceResult,
  isAffordabilityCollapsed,
  setIsAffordabilityCollapsed,
  resolvedZipCode,
}: RenderOnboardingStepProps): React.ReactNode {
  const zip = resolvedZipCode ?? resolveIdealZipCode(formData);
  const isBuyer = shouldShowBuyerOnboardingUi(formData);

  switch (stepId) {
    case "onboarding_role":
      return <OnboardingRoleStep formData={formData} updateFormData={updateFormData} />;

    case "demographics":
      return isBuyer ? (
        <BuyerAboutMeStepContent
          formData={formData}
          updateField={(field, value) => updateFormData(field, value)}
        />
      ) : (
        <DemographicsSection
          formData={formData}
          isEditMode={true}
          updateFormData={updateFormData}
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

    case "financial":
      return isBuyer ? (
        <BuyerFinancingStepContent
          formData={formData}
          updateField={(field, value) => updateFormData(field, value)}
          homePriceLoading={homePriceLoading}
          homePriceError={homePriceError ?? null}
          homePriceResult={homePriceResult ?? null}
          isAffordabilityCollapsed={isAffordabilityCollapsed ?? false}
          setIsAffordabilityCollapsed={setIsAffordabilityCollapsed}
          resolvedZipCode={zip}
          showAffordabilityZipHint={!zip && !formData.paying_cash}
        />
      ) : null;

    case "seller_shell_setup":
      return (
        <WorkspaceShellSetupStep
          formData={formData}
          updateFormData={updateFormData}
          copy={{
            title: SELLER_TRANSLATIONS.SELLER_SHELL_SETUP_TITLE,
            subtitle: SELLER_TRANSLATIONS.SELLER_SHELL_SETUP_SUBTITLE,
            inputLabel: SELLER_TRANSLATIONS.SELLER_SHELL_TEST_INPUT_LABEL,
          }}
        />
      );

    case "renter_shell_setup":
      return (
        <WorkspaceShellSetupStep
          formData={formData}
          updateFormData={updateFormData}
          copy={{
            title: RENTER_TRANSLATIONS.RENTER_SHELL_SETUP_TITLE,
            subtitle: RENTER_TRANSLATIONS.RENTER_SHELL_SETUP_SUBTITLE,
            inputLabel: RENTER_TRANSLATIONS.RENTER_SHELL_TEST_INPUT_LABEL,
          }}
        />
      );

    case "brokerage_shell_setup":
      return (
        <WorkspaceShellSetupStep
          formData={formData}
          updateFormData={updateFormData}
          copy={{
            title: BROKERAGE_TRANSLATIONS.BROKERAGE_SHELL_SETUP_TITLE,
            subtitle: BROKERAGE_TRANSLATIONS.BROKERAGE_SHELL_SETUP_SUBTITLE,
            inputLabel: BROKERAGE_TRANSLATIONS.BROKERAGE_SHELL_TEST_INPUT_LABEL,
          }}
        />
      );

    case "integration_partner_shell_setup":
      return (
        <WorkspaceShellSetupStep
          formData={formData}
          updateFormData={updateFormData}
          copy={{
            title: INTEGRATION_PARTNER_TRANSLATIONS.INTEGRATION_PARTNER_SHELL_SETUP_TITLE,
            subtitle: INTEGRATION_PARTNER_TRANSLATIONS.INTEGRATION_PARTNER_SHELL_SETUP_SUBTITLE,
            inputLabel: INTEGRATION_PARTNER_TRANSLATIONS.INTEGRATION_PARTNER_SHELL_TEST_INPUT_LABEL,
          }}
        />
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
