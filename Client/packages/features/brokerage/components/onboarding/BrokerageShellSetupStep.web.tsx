import Input from "@ui/form/Input";

import { BROKERAGE_TRANSLATIONS } from "packages/features/brokerage/types/translations";
import type { OnboardingData } from "packages/features/profile/types/onboarding/onboarding";
import { Box } from "packages/ui/components/structure/primitives";

import { BodyText, Label, Title } from "@/components/ui";

type BrokerageShellSetupStepProps = {
  formData: OnboardingData;
  updateFormData: (field: keyof OnboardingData | string, value: unknown) => void;
};

export function BrokerageShellSetupStep({
  formData,
  updateFormData,
}: BrokerageShellSetupStepProps) {
  return (
    <Box className="px-4 pt-4 sm:px-6">
      <Title as="h2" size="lg" className="text-text-primary mb-2">
        {BROKERAGE_TRANSLATIONS.BROKERAGE_SHELL_SETUP_TITLE}
      </Title>
      <BodyText size="sm" muted className="mb-6 max-w-xl">
        {BROKERAGE_TRANSLATIONS.BROKERAGE_SHELL_SETUP_SUBTITLE}
      </BodyText>
      <Label size="sm">{BROKERAGE_TRANSLATIONS.BROKERAGE_SHELL_TEST_INPUT_LABEL}</Label>
      <Input
        value={formData.workspace_shell_test_input ?? ""}
        onChange={(event) => updateFormData("workspace_shell_test_input", event.target.value)}
        className="mt-2"
      />
    </Box>
  );
}
