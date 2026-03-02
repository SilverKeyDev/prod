import React from "react";

import { Alert, KeyboardAvoidingView, ScrollView, StyleSheet, View } from "react-native";

import { useFeature } from "packages/contexts";
import { color } from "packages/design-tokens";
import { useOnboardingForm } from "packages/features/homeauth/hooks/data/onboarding/useOnboardingForm";
import { Pressable } from "packages/ui/components/primitives";
import { Box } from "packages/ui/components/primitives/box";
import { Text } from "packages/ui/components/primitives/text";

import { DemographicsStep } from "./DemographicsStep.native";
import { HousingStep } from "./HousingStep.native";
import { LocationStep } from "./LocationStep.native";

export type OnboardingScreenNativeProps = {
  /** Called when user completes onboarding successfully (e.g. update store and re-render root). */
  onSubmitSuccess?: () => void;
};

const KEYBOARD_AVOIDING_IOS = "onboarding_ios_keyboard_avoiding";

export function OnboardingScreenNative({ onSubmitSuccess }: OnboardingScreenNativeProps) {
  const useIOSKeyboardAvoiding = useFeature(KEYBOARD_AVOIDING_IOS);
  const {
    steps,
    formData,
    updateFormData,
    currentStep,
    nextStep,
    prevStep,
    loading,
    showValidationWarning,
    validationResult,
    handleSubmit,
    handleCloseValidationWarning,
    handleReviewInformation,
  } = useOnboardingForm({ onSubmitSuccess });

  React.useEffect(() => {
    if (showValidationWarning && validationResult.missingFields.length > 0) {
      Alert.alert(
        "Missing information",
        validationResult.missingFields.join("\n") +
          (validationResult.errors.length > 0 ? "\n\n" + validationResult.errors.join("\n") : ""),
        [
          { text: "Review", onPress: handleReviewInformation },
          { text: "OK", onPress: handleCloseValidationWarning },
        ]
      );
    }
  }, [
    showValidationWarning,
    validationResult,
    handleReviewInformation,
    handleCloseValidationWarning,
  ]);

  const step = steps[currentStep];
  const isLastStep = currentStep === steps.length - 1;

  const renderStepContent = () => {
    if (!step) return null;
    switch (step.id) {
      case "demographics":
        return <DemographicsStep formData={formData} updateFormData={updateFormData} />;
      case "housing":
        return <HousingStep formData={formData} updateFormData={updateFormData} />;
      case "location":
        return <LocationStep formData={formData} updateFormData={updateFormData} />;
      default:
        return null;
    }
  };

  return (
    <KeyboardAvoidingView
      style={styles.container}
      behavior={useIOSKeyboardAvoiding ? "padding" : undefined}
      keyboardVerticalOffset={useIOSKeyboardAvoiding ? 64 : 0}
    >
      <View style={styles.progressRow}>
        <Text className="text-sm text-gray-600">
          Step {currentStep + 1} of {steps.length}
        </Text>
      </View>

      <ScrollView
        style={styles.scroll}
        contentContainerStyle={styles.scrollContent}
        keyboardShouldPersistTaps="handled"
        showsVerticalScrollIndicator={false}
      >
        <Box className="px-4 pb-6 pt-2">{renderStepContent()}</Box>
      </ScrollView>

      <View style={styles.footer}>
        {currentStep > 0 ? (
          <Pressable onPress={prevStep} style={styles.backButton}>
            <Text className="text-base font-medium text-gray-700">Back</Text>
          </Pressable>
        ) : (
          <View style={styles.backPlaceholder} />
        )}
        <Pressable
          onPress={isLastStep ? handleSubmit : nextStep}
          disabled={loading}
          style={[styles.primaryButton, loading && styles.primaryButtonDisabled]}
        >
          <Text className="text-base font-semibold text-white">
            {loading ? "Saving…" : isLastStep ? "Done" : "Continue"}
          </Text>
        </Pressable>
      </View>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: color("neutral.100"),
  },
  progressRow: {
    paddingHorizontal: 16,
    paddingTop: 8,
    paddingBottom: 4,
  },
  scroll: {
    flex: 1,
  },
  scrollContent: {
    paddingBottom: 24,
  },
  footer: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingHorizontal: 16,
    paddingVertical: 12,
    paddingBottom: 24,
    backgroundColor: color("neutral.100"),
    borderTopWidth: StyleSheet.hairlineWidth,
    borderTopColor: color("neutral.200"),
  },
  backButton: {
    paddingVertical: 12,
    paddingHorizontal: 16,
    minWidth: 80,
  },
  backPlaceholder: {
    minWidth: 80,
  },
  primaryButton: {
    backgroundColor: color("brand.accent"),
    paddingVertical: 14,
    paddingHorizontal: 24,
    borderRadius: 10,
    minWidth: 120,
    alignItems: "center",
  },
  primaryButtonDisabled: {
    opacity: 0.7,
  },
});
