import React from "react";

import { Box, Pressable, Text } from "packages/ui/components/primitives";
import {
  ONBOARDING_ROLE_COMING_SOON_LABEL,
  ONBOARDING_ROLE_PICKER_OPTIONS,
} from "packages/utils/domain/profile/onboardingRolePicker";

import {
  applyOnboardingRoleSelection,
  FIELD_LABELS,
  type OnboardingData,
  type PrimaryOnboardingRole,
  primaryOnboardingRoleFromForm,
} from "@/features/profile/utils";

type OnboardingRoleStepProps = {
  formData: OnboardingData;
  updateFormData: (field: string | number | symbol, value: unknown) => void;
};

/** First onboarding step: role tiles (buyer / agent active; seller / integration partner coming soon). */
export function OnboardingRoleStep({ formData, updateFormData }: OnboardingRoleStepProps) {
  const selected = primaryOnboardingRoleFromForm(formData);

  const onPick = (role: PrimaryOnboardingRole) => {
    applyOnboardingRoleSelection(role, updateFormData);
  };

  return (
    <Box className="gap-5">
      <Text className="text-text-primary text-lg font-semibold">
        {FIELD_LABELS.ONBOARDING_ROLE_HEADLINE}
      </Text>
      <Text className="text-text-secondary text-sm leading-snug">
        {FIELD_LABELS.ONBOARDING_ROLE_SUBTITLE}
      </Text>

      <Box className="-mx-0.5 flex flex-row flex-wrap gap-3">
        {ONBOARDING_ROLE_PICKER_OPTIONS.map((opt) => {
          const role = opt.value;
          const isSelected = selected === role && opt.enabled;
          const isDisabled = !opt.enabled;
          return (
            <Pressable
              key={opt.value}
              disabled={isDisabled}
              onPress={() => onPick(role)}
              accessibilityRole="button"
              accessibilityState={{ selected: isSelected, disabled: isDisabled }}
              className={`min-h-20 w-[48%] flex-grow basis-[44%] rounded-2xl border-2 px-3 py-4 ${
                isDisabled
                  ? "border-border bg-muted/30 opacity-60"
                  : isSelected
                    ? "border-primary bg-primary/10"
                    : "border-border bg-background-surface"
              }`}
            >
              <Text
                className={`text-center text-base font-semibold ${
                  isDisabled
                    ? "text-text-secondary"
                    : isSelected
                      ? "text-text-primary"
                      : "text-text-secondary"
                }`}
              >
                {opt.label}
              </Text>
              {isDisabled ? (
                <Text className="text-text-secondary mt-1 text-center text-xs">
                  {ONBOARDING_ROLE_COMING_SOON_LABEL}
                </Text>
              ) : null}
            </Pressable>
          );
        })}
      </Box>
    </Box>
  );
}
