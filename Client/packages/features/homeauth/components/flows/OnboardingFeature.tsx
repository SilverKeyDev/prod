import { useOnboardingForm } from "packages/hooks/data/auth/onboarding/useOnboardingForm";
import { LOGO } from "packages/ui/components/asset";
import { Box, Image } from "packages/ui/components/primitives";

import Card from "@/components/layout/Card.web";
import { BodyText, NavigationButtons, SkipButton, Title } from "@/components/ui";
import OnboardingHeader from "@/features/profile/components/onboard/Header";
import OnboardingRoleStep from "@/features/profile/components/onboard/OnboardingRoleStep.web";
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
import { isOnboardingStepComplete } from "@/features/profile/utils";

export function OnboardingFeature() {
  const {
    steps,
    formData,
    updateFormData,
    patchBuyerPreferenceExtensions,
    currentStep,
    nextStep,
    prevStep,
    goToStep,
    loading,
    scriptsReady,
    loadError,
    handleSubmit,
  } = useOnboardingForm();

  const currentStepId = steps[currentStep]?.id ?? "";
  const isRoleIntroPage = currentStepId === "onboarding_role";
  const progressStepEntries = steps
    .map((step, index) => ({ step, index }))
    .filter(({ step }) => step.id !== "onboarding_role");
  const progressSteps = progressStepEntries.map(({ step }) => step);
  const progressCurrentIndex = Math.max(
    0,
    progressStepEntries.findIndex(({ index }) => index === currentStep)
  );
  const showSkipForNow = currentStep < steps.length - 1 && currentStepId !== "";

  const roleStepNeedsSelection =
    currentStepId === "onboarding_role" && !isOnboardingStepComplete(formData, "onboarding_role");

  const renderStepContent = () => {
    const step = steps[currentStep];

    switch (step?.id ?? "") {
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
            showAgentChoice={false}
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
  };

  return (
    <Box className="bg-background-base min-h-screen">
      <Box className="mx-auto w-full max-w-3xl px-4 pb-20 sm:px-6 sm:pb-8 lg:px-8">
        {/* Header */}
        <Box className="mb-3 mt-4 flex items-center justify-between sm:mb-4 sm:mt-6">
          <Box className="flex items-center">
            <Image src={LOGO} alt="SilverKey Logo" className="h-6 sm:h-8 md:h-10" />
          </Box>
          <Box className="flex items-center gap-4">
            {showSkipForNow ? (
              <SkipButton
                onSkip={handleSubmit}
                skipText="Skip for now"
                disabled={loading}
                size="sm"
              />
            ) : null}
          </Box>
        </Box>

        {/* Role intro is a standalone first page outside normal onboarding progress. */}
        {!isRoleIntroPage ? (
          <OnboardingHeader
            steps={progressSteps}
            currentStep={progressCurrentIndex}
            onStepClick={(progressStepIndex) => {
              const target = progressStepEntries[progressStepIndex];
              if (!target) return;
              goToStep(target.index);
            }}
          />
        ) : null}

        {/* Step Content */}
        <Box className="bg-background-surface mt-4 rounded-2xl shadow-sm">
          <Card border="light" className="pb-8 sm:pb-12">
            {renderStepContent()}

            {/* Navigation Buttons */}
            <Box className="border-border mt-10 border-t px-4 pb-1 pt-8 sm:px-6 sm:pb-2">
              <NavigationButtons
                currentStep={currentStep}
                totalSteps={steps.length}
                onPrevious={prevStep}
                onNext={nextStep}
                onSubmit={handleSubmit}
                loading={loading}
                disableNext={roleStepNeedsSelection}
                layout="centered"
                size="md"
              />
              {showSkipForNow ? (
                <Box className="mt-6 flex justify-center">
                  <SkipButton
                    onSkip={handleSubmit}
                    skipText="Skip for now"
                    disabled={loading}
                    size="md"
                  />
                </Box>
              ) : null}
            </Box>
          </Card>
        </Box>
      </Box>
    </Box>
  );
}
