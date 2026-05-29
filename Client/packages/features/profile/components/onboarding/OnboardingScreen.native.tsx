import React from "react";

import KeyTurnLoader from "@ui/asset/loading/KeyTurnLoader";
import { KeyboardAvoidingView, Pressable, StyleSheet, View } from "react-native";

import { useFeature } from "packages/contexts";
import { color } from "packages/design-tokens";
import { useOnboardingForm } from "packages/features/homeauth/hooks/data/onboarding/useOnboardingForm";
import { isOnboardingStepComplete } from "packages/features/profile/utils";
import { Box } from "packages/ui/components/primitives";
import { Text } from "packages/ui/components/primitives";
import ScrollView from "packages/ui/components/primitives/scroll/ScrollView";

import { renderOnboardingStep } from "./renderOnboardingStep.native";

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
    patchBuyerPreferenceExtensions,
    currentStep,
    nextStep,
    prevStep,
    goToStep,
    loading,
    handleSubmit,
  } = useOnboardingForm({ onSubmitSuccess });

  const step = steps[currentStep];
  const isLastStep = currentStep === steps.length - 1;
  const isRoleIntroPage = step?.id === "onboarding_role";
  const progressStepEntries = steps
    .map((item, index) => ({ item, index }))
    .filter(({ item }) => item.id !== "onboarding_role");
  const progressCurrentStepNumber = Math.max(
    1,
    progressStepEntries.findIndex(({ index }) => index === currentStep) + 1
  );
  const roleStepNeedsSelection =
    Boolean(step?.id === "onboarding_role") &&
    !isOnboardingStepComplete(formData, "onboarding_role");

  const renderStepContent = () => {
    if (!step) return null;
    return renderOnboardingStep({
      stepId: step.id,
      formData,
      updateFormData,
      patchBuyerPreferenceExtensions,
    });
  };

  return (
    <KeyboardAvoidingView
      style={styles.container}
      behavior={useIOSKeyboardAvoiding ? "padding" : undefined}
      keyboardVerticalOffset={useIOSKeyboardAvoiding ? 64 : 0}
    >
      {!isRoleIntroPage ? (
        <View style={styles.progressRow}>
          <Text className="text-text-secondary text-sm">
            Step {progressCurrentStepNumber} of {progressStepEntries.length}
          </Text>
          <Box className="mt-2 flex flex-row items-center justify-center gap-2">
            {progressStepEntries.map(({ item, index }) => {
              const isActive = index === currentStep;
              return (
                <Pressable
                  key={item.id}
                  onPress={() => goToStep(index)}
                  style={[
                    styles.stepPill,
                    isActive ? styles.stepPillActive : styles.stepPillInactive,
                  ]}
                >
                  <Text className="text-xs font-medium">{item.title}</Text>
                </Pressable>
              );
            })}
          </Box>
        </View>
      ) : null}

      <ScrollView
        style={styles.scroll}
        contentContainerStyle={styles.scrollContent}
        keyboardShouldPersistTaps="handled"
        showsVerticalScrollIndicator={false}
      >
        <Box className="px-4 pb-6 pt-2">{renderStepContent()}</Box>
      </ScrollView>

      <View style={styles.footer}>
        {!isLastStep && step?.id !== "demographics" && step?.id !== "onboarding_role" ? (
          <Pressable
            onPress={handleSubmit}
            disabled={loading}
            accessibilityRole="button"
            label="Skip for now"
            accessibilityState={{ disabled: loading }}
            style={styles.skipForNowRow}
          >
            <Text
              className={`text-center text-base ${loading ? "text-text-muted" : "text-text-secondary underline"}`}
            >
              Skip for now
            </Text>
          </Pressable>
        ) : null}
        <View style={styles.footerRow}>
          {currentStep > 0 ? (
            <Pressable onPress={prevStep} style={styles.backButton}>
              <Text className="text-text-secondary text-base font-medium">Back</Text>
            </Pressable>
          ) : (
            <View style={styles.backPlaceholder} />
          )}
          <Pressable
            onPress={isLastStep ? handleSubmit : nextStep}
            disabled={loading || roleStepNeedsSelection}
            accessibilityRole="button"
            accessibilityState={{ busy: loading, disabled: loading || roleStepNeedsSelection }}
            style={[
              styles.primaryButton,
              (loading || roleStepNeedsSelection) && styles.primaryButtonDisabled,
            ]}
          >
            {loading ? (
              <KeyTurnLoader message="" />
            ) : (
              <Text className="text-base font-semibold text-white">
                {isLastStep ? "Done" : "Continue"}
              </Text>
            )}
          </Pressable>
        </View>
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
  stepPill: {
    paddingVertical: 6,
    paddingHorizontal: 10,
    borderRadius: 999,
  },
  stepPillActive: {
    backgroundColor: color("brand.accent"),
  },
  stepPillInactive: {
    backgroundColor: color("neutral.0"),
  },
  scroll: {
    flex: 1,
  },
  scrollContent: {
    paddingBottom: 24,
  },
  footer: {
    flexDirection: "column",
    paddingHorizontal: 16,
    paddingTop: 8,
    paddingBottom: 24,
    backgroundColor: color("neutral.100"),
    borderTopWidth: StyleSheet.hairlineWidth,
    borderTopColor: color("neutral.200"),
  },
  skipForNowRow: {
    paddingVertical: 10,
    alignItems: "center",
  },
  footerRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingVertical: 8,
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
