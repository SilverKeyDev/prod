import React from "react";

import {
  RenterBudgetStep,
  RenterMoveTimelineStep,
  RenterHouseholdStep,
  RenterAmenitiesStep,
} from "packages/features/profile/components/onboarding/renter";
import { BROKERAGE_TRANSLATIONS } from "packages/features/brokerage/types/translations";
import { INTEGRATION_PARTNER_TRANSLATIONS } from "packages/features/integrationPartner/types/translations";
import {
  AgentBrokerageSection,
  AgentLicensingSection,
  AgentProfileServiceSection,
} from "packages/features/profile/components/formSections";
import { AgentDemographicsFields } from "packages/features/profile/components/formSections/demographics/AgentDemographicsFields";
import {
  BuyerAboutMeStepContent,
  BuyerFinancingStepContent,
} from "packages/features/profile/components/onboarding/buyer";
import { ProfileSearchPropertySection } from "packages/features/profile/components/profileScreen/tabs/search/ProfileSearchPropertySection";
import { shouldShowBuyerOnboardingUi } from "packages/features/profile/utils/onboarding/role/onboardingRoleSelection";
import { RENTER_TRANSLATIONS } from "packages/features/renter/types/translations";
import { SELLER_TRANSLATIONS } from "packages/features/seller/types/translations";
import { WorkspaceShellSetupStep } from "packages/features/workspace/components/onboarding/WorkspaceShellSetupStep.native";
import { Box } from "packages/ui/components/structure/primitives";
import { Text } from "packages/ui/components/structure/primitives";
import { resolveIdealZipCode } from "packages/utils/product/domain/profile/resolveIdealZipCode";

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
        <AgentDemographicsFields
          formData={formData}
          isEditMode={true}
          updateFormData={(field, value) => updateFormData(field, value)}
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

    case "renter_budget":
      return <RenterBudgetStep formData={formData} updateFormData={updateFormData} />;

    case "renter_location":
      return (
        <LocationStep
          formData={formData}
          updateFormData={updateFormData}
          patchBuyerPreferenceExtensions={patchBuyerPreferenceExtensions}
        />
      );

    case "renter_move_timeline":
      return <RenterMoveTimelineStep formData={formData} updateFormData={updateFormData} />;

    case "renter_household":
      return <RenterHouseholdStep formData={formData} updateFormData={updateFormData} />;

    case "renter_amenities":
      return <RenterAmenitiesStep formData={formData} updateFormData={updateFormData} />;

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