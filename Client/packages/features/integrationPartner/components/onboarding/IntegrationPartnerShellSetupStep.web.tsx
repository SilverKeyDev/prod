import Input from "@ui/form/Input";

import { INTEGRATION_PARTNER_TRANSLATIONS } from "packages/features/integrationPartner/types/translations";
import type { OnboardingData } from "packages/features/profile/types/onboarding/onboarding";
import { Box } from "packages/ui/components/structure/primitives";

import { BodyText, Label, Title } from "@/components/ui";

type IntegrationPartnerShellSetupStepProps = {
  formData: OnboardingData;
  updateFormData: (field: keyof OnboardingData | string, value: unknown) => void;
};

export function IntegrationPartnerShellSetupStep({
  formData,
  updateFormData,
}: IntegrationPartnerShellSetupStepProps) {
  return (
    <Box className="px-4 pt-4 sm:px-6">
      <Title as="h2" size="lg" className="text-text-primary mb-2">
        {INTEGRATION_PARTNER_TRANSLATIONS.INTEGRATION_PARTNER_SHELL_SETUP_TITLE}
      </Title>
      <BodyText size="sm" muted className="mb-6 max-w-xl">
        {INTEGRATION_PARTNER_TRANSLATIONS.INTEGRATION_PARTNER_SHELL_SETUP_SUBTITLE}
      </BodyText>
      <Label size="sm">
        {INTEGRATION_PARTNER_TRANSLATIONS.INTEGRATION_PARTNER_SHELL_TEST_INPUT_LABEL}
      </Label>
      <Input
        value={formData.workspace_shell_test_input ?? ""}
        onChange={(event) => updateFormData("workspace_shell_test_input", event.target.value)}
        className="mt-2"
      />
    </Box>
  );
}
