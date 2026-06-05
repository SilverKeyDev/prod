import React from "react";

import { Box, Pressable, Text } from "packages/ui/components/structure/primitives";
import { ONBOARDING_ROLE_PICKER_OPTIONS } from "packages/utils/product/domain/profile/onboardingRolePicker";

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

/** First onboarding step: role tiles for all supported workspace personas. */
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
          const isSelected = selected === role;
          return (
            <Pressable
              key={opt.value}
              onPress={() => onPick(role)}
              accessibilityRole="button"
              accessibilityState={{ selected: isSelected }}
              className={`min-h-20 w-[48%] flex-grow basis-[44%] rounded-2xl border-2 px-3 py-4 sm:basis-[30%] ${
                isSelected ? "border-primary bg-primary/10" : "border-border bg-background-surface"
              }`}
            >
              <Text
                className={`text-center text-base font-semibold ${
                  isSelected ? "text-text-primary" : "text-text-secondary"
                }`}
              >
                {opt.label}
              </Text>
            </Pressable>
          );
        })}
      </Box>
    </Box>
  );
}
