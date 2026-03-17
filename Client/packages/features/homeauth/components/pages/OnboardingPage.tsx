import { useOnboardingForm } from "packages/hooks/data/auth/onboarding/useOnboardingForm";
import { LOGO } from "packages/ui/components/asset";
import { Image } from "packages/ui/components/primitives";

import { ValidationWarning } from "@/components/feedback";
import Card from "@/components/layout/Card.web";
import { BodyText, NavigationButtons, Title } from "@/components/ui";
import OnboardingHeader from "@/features/profile/components/onboard/Header";
import {
  DemographicsSection,
  HousingSection,
  LocationSection,
  OnboardingFinancialSection,
} from "@/features/profile/components/sections/index.web";

export default function OnboardingPage() {
  const {
    steps,
    formData,
    updateFormData,
    currentStep,
    nextStep,
    prevStep,
    goToStep,
    loading,
    scriptsReady,
    loadError,
    showValidationWarning,
    validationResult,
    handleSubmit,
    handleCloseValidationWarning,
    handleReviewInformation,
    homePriceLoading,
    homePriceError,
    homePriceResult,
    isAffordabilityCollapsed,
    setIsAffordabilityCollapsed,
    isDesktop,
  } = useOnboardingForm();

  const renderStepContent = () => {
    const step = steps[currentStep];

    switch (step.id) {
      case "demographics":
        return (
          <DemographicsSection
            formData={formData}
            isEditMode={true}
            updateFormData={updateFormData}
            wrapInCard={false}
            hideProfilePictureWhenOnboarding={true}
          />
        );

      case "financial":
        return (
          <OnboardingFinancialSection
            formData={formData}
            updateFormData={updateFormData}
            homePriceLoading={homePriceLoading}
            homePriceError={homePriceError}
            homePriceResult={homePriceResult}
            isAffordabilityCollapsed={isAffordabilityCollapsed}
            setIsAffordabilityCollapsed={setIsAffordabilityCollapsed}
          />
        );

      case "housing":
        return (
          <HousingSection
            formData={formData}
            isEditMode={true}
            updateFormData={updateFormData}
            isDesktop={isDesktop}
            wrapInCard={false}
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
          />
        );

      default:
        return (
          <div className="py-8 text-center">
            <Title as="h2" size="md" className="text-text-primary mb-2">
              Complete your profile
            </Title>
            <BodyText size="sm" muted className="mx-auto max-w-md">
              Use the buttons below to continue or go back to another step.
            </BodyText>
          </div>
        );
    }
  };

  return (
    <div className="bg-background-base min-h-screen">
      <div className="mx-auto w-full max-w-3xl px-4 pb-20 sm:px-6 sm:pb-8 lg:px-8">
        {/* Header */}
        <div className="mb-3 mt-4 flex items-center justify-between sm:mb-4 sm:mt-6">
          <div className="flex items-center">
            <Image src={LOGO} alt="SilverKey Logo" className="h-6 sm:h-8 md:h-10" />
          </div>
          <div className="flex items-center gap-4" />
        </div>

        {/* Progress Bar */}
        <OnboardingHeader steps={steps} currentStep={currentStep} onStepClick={goToStep} />

        {/* Step Content */}
        <div className="bg-background-surface mt-4 rounded-2xl shadow-sm">
          <Card className="pb-8 sm:pb-12">
            {renderStepContent()}

            {/* Navigation Buttons */}
            <div className="border-border mt-10 border-t px-4 pb-1 pt-8 sm:px-6 sm:pb-2">
              <NavigationButtons
                currentStep={currentStep}
                totalSteps={steps.length}
                onPrevious={prevStep}
                onNext={nextStep}
                onSubmit={handleSubmit}
                loading={loading}
                layout="centered"
                size="md"
              />
            </div>
          </Card>
        </div>

        {/* Validation Warning Modal */}
        <ValidationWarning
          isVisible={showValidationWarning}
          onClose={handleCloseValidationWarning}
          onReview={handleReviewInformation}
          missingFields={validationResult.missingFields}
          errors={validationResult.errors}
        />
      </div>
    </div>
  );
}
