import { isOnboardingStepComplete } from "packages/features/profile";
import { PersonalizationSectionLayoutProvider } from "packages/features/profile/components/layout";
import { renderOnboardingStep } from "packages/features/profile/components/onboarding/renderOnboardingStep.web";
import type { ProfileStepId } from "packages/features/profile/types/onboarding/profileStepIds";
import { useOnboardingForm } from "packages/hooks/data/auth/onboarding/useOnboardingForm";
import { LOGO } from "packages/ui/components/media/asset";
import { Box, Image } from "packages/ui/components/structure/primitives";

import Card from "@/components/layout/Card.web";
import { NavigationButtons } from "@/components/ui";
import OnboardingHeader from "@/features/profile/components/onboarding/header/Header.web";

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
    homePriceLoading,
    homePriceError,
    homePriceResult,
    isAffordabilityCollapsed,
    setIsAffordabilityCollapsed,
    resolvedZipCode,
  } = useOnboardingForm();

  const currentStepId = (steps[currentStep]?.id ?? "") as ProfileStepId;
  const isRoleIntroPage = currentStepId === "onboarding_role";
  const progressStepEntries = steps
    .map((step, index) => ({ step, index }))
    .filter(({ step }) => step.id !== "onboarding_role");
  const progressSteps = progressStepEntries.map(({ step }) => step);
  const progressCurrentIndex = Math.max(
    0,
    progressStepEntries.findIndex(({ index }) => index === currentStep)
  );
  const roleStepNeedsSelection =
    currentStepId === "onboarding_role" && !isOnboardingStepComplete(formData, "onboarding_role");

  return (
    <Box className="bg-background-base min-h-screen">
      <Box className="mx-auto w-full max-w-3xl px-4 pb-20 sm:px-6 sm:pb-8 lg:px-8">
        {/* Header */}
        <Box className="mb-3 mt-4 flex items-center justify-between sm:mb-4 sm:mt-6">
          <Box className="flex items-center">
            <Image src={LOGO} alt="SilverKey Logo" className="h-6 sm:h-8 md:h-10" />
          </Box>
          {/* Skip for now — temporarily disabled
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
          */}
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
            <PersonalizationSectionLayoutProvider profileUiSurface="onboarding">
              {renderOnboardingStep({
                stepId: currentStepId,
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
              })}
            </PersonalizationSectionLayoutProvider>

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
              {/* Skip for now — temporarily disabled
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
              */}
            </Box>
          </Card>
        </Box>
      </Box>
    </Box>
  );
}
