import React from "react";

import { Button } from "packages/ui";
import { Box } from "packages/ui/components/primitives";
import {
  ONBOARDING_ROLE_COMING_SOON_LABEL,
  ONBOARDING_ROLE_PICKER_OPTIONS,
} from "packages/utils/domain/profile/onboardingRolePicker";

import { BodyText, Title } from "@/components/ui";
import {
  applyOnboardingRoleSelection,
  FIELD_LABELS,
  type OnboardingData,
  type PrimaryOnboardingRole,
  primaryOnboardingRoleFromForm,
} from "@/features/profile/utils";

type OnboardingRoleStepProps = {
  formData: OnboardingData;
  updateFormData: (field: keyof OnboardingData, value: unknown) => void;
};

export default function OnboardingRoleStep({ formData, updateFormData }: OnboardingRoleStepProps) {
  const selected = primaryOnboardingRoleFromForm(formData);

  const onPick = (role: PrimaryOnboardingRole) => {
    applyOnboardingRoleSelection(role, updateFormData);
  };

  return (
    <Box className="px-4 pt-4 sm:px-6">
      <Title as="h2" size="lg" className="text-text-primary mb-2">
        {FIELD_LABELS.ONBOARDING_ROLE_HEADLINE}
      </Title>
      <BodyText size="sm" muted className="mb-8 max-w-xl">
        {FIELD_LABELS.ONBOARDING_ROLE_SUBTITLE}
      </BodyText>

      <Box className="mx-auto grid max-w-lg grid-cols-1 gap-3 sm:grid-cols-2 sm:gap-4">
        {ONBOARDING_ROLE_PICKER_OPTIONS.map((opt) => {
          const role = opt.value;
          const isSelected = selected === role && opt.enabled;
          const isDisabled = !opt.enabled;
          return (
            <Button
              key={opt.value}
              type="button"
              variant="outline"
              disabled={isDisabled}
              onPress={() => onPick(role)}
              accessibilityRole="button"
              accessibilityState={{ selected: isSelected, disabled: isDisabled }}
              className={`min-h-20 flex-col justify-center gap-1 rounded-2xl border-2 px-4 py-4 text-center transition-colors sm:min-h-24 ${
                isDisabled
                  ? "border-border bg-muted/40 text-text-secondary hover:border-border hover:bg-muted/40 cursor-not-allowed opacity-60"
                  : isSelected
                    ? "border-primary bg-primary/10 text-text-primary ring-primary/30 ring-offset-background-base shadow-sm ring-2 ring-offset-2"
                    : "border-border text-text-secondary bg-background-base hover:border-accent-muted hover:bg-accent-muted"
              }`}
            >
              <BodyText as="span" size="md" className="font-semibold tracking-tight">
                {opt.label}
              </BodyText>
              {isDisabled ? (
                <BodyText size="xs" muted className="font-normal">
                  {ONBOARDING_ROLE_COMING_SOON_LABEL}
                </BodyText>
              ) : null}
            </Button>
          );
        })}
      </Box>
    </Box>
  );
}
