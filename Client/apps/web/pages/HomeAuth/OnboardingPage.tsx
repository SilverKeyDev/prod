import { useOnboardingForm } from "packages/hooks/data/auth/onboarding/useOnboardingForm";

import { ValidationWarning } from "@/components/feedback";
import Card from "@/components/layout/Card.web";
import { Image, NavigationButtons } from "@/components/ui/index.web";
import OnboardingHeader from "@/features/profile/onboard/Header";
import {
  DemographicsSection,
  HousingSection,
  LocationSection,
  OnboardingFinancialSection,
} from "@/features/profile/sections/index.web";

import KeyLogo from "/logo.png?url";

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
        return <div>Step content for {step.title} coming soon...</div>;
    }
  };

  return (
    <div className="min-h-screen bg-off-white">
      <div className="mx-auto w-full max-w-3xl px-4 pb-20 sm:px-6 sm:pb-8 lg:px-8">
        {/* Header */}
        <div className="mb-3 mt-4 flex items-center justify-between sm:mb-4 sm:mt-6">
          <div className="flex items-center">
            <Image
              src={KeyLogo}
              alt="SilverKey Logo"
              className="h-6 sm:h-8 md:h-10"
            />
          </div>
          <div className="flex items-center gap-4" />
        </div>

        {/* Progress Bar */}
        <OnboardingHeader
          steps={steps}
          currentStep={currentStep}
          onStepClick={goToStep}
        />

        {/* Step Content */}
        <div className="mt-4 rounded-2xl bg-white shadow-sm">
          <Card className="pb-8 sm:pb-12">
            {renderStepContent()}

            {/* Navigation Buttons */}
            <div className="mt-10 border-t border-beige/30 px-4 pb-1 pt-8 sm:px-6 sm:pb-2">
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
