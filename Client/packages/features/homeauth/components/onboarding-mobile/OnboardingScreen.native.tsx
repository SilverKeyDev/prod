import React from "react";

import KeyTurnLoader from "@ui/asset/loading/KeyTurnLoader";
import { KeyboardAvoidingView, Pressable, StyleSheet, View } from "react-native";

import { useFeature } from "packages/contexts";
import { color } from "packages/design-tokens";
import { useOnboardingForm } from "packages/features/homeauth/hooks/data/onboarding/useOnboardingForm";
import { ProfileSearchPropertySection } from "packages/features/profile/components/profileScreen/sections/ProfileSearchPropertySection";
/* Agent sections shared with profile for onboarding; consistent agent form with web. */
import {
  AgentBrokerageSection,
  AgentLicensingSection,
  AgentProfileServiceSection,
} from "packages/features/profile/components/sections";
import { Box } from "packages/ui/components/primitives";
import { Text } from "packages/ui/components/primitives";
import ScrollView from "packages/ui/components/primitives/scroll/ScrollView";

import { DemographicsStep } from "./DemographicsStep.native";
import { HousingStepEssentials } from "./housing/HousingStepEssentials.native";
import { HousingStepRanges } from "./housing/HousingStepRanges.native";
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

  const renderStepContent = () => {
    if (!step) return null;
    switch (step.id) {
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
  };

  return (
    <KeyboardAvoidingView
      style={styles.container}
      behavior={useIOSKeyboardAvoiding ? "padding" : undefined}
      keyboardVerticalOffset={useIOSKeyboardAvoiding ? 64 : 0}
    >
      <View style={styles.progressRow}>
        <Text className="text-text-secondary text-sm">
          Step {currentStep + 1} of {steps.length}
        </Text>
        <Box className="mt-2 flex flex-row items-center justify-center gap-2">
          {steps.map((s, index) => {
            const isActive = index === currentStep;
            return (
              <Pressable
                key={s.id}
                onPress={() => goToStep(index)}
                style={[
                  styles.stepPill,
                  isActive ? styles.stepPillActive : styles.stepPillInactive,
                ]}
              >
                <Text className="text-xs font-medium">{s.title}</Text>
              </Pressable>
            );
          })}
        </Box>
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
            <Text className="text-text-secondary text-base font-medium">Back</Text>
          </Pressable>
        ) : (
          <View style={styles.backPlaceholder} />
        )}
        <Pressable
          onPress={isLastStep ? handleSubmit : nextStep}
          disabled={loading}
          accessibilityRole="button"
          accessibilityState={{ busy: loading }}
          style={[styles.primaryButton, loading && styles.primaryButtonDisabled]}
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
