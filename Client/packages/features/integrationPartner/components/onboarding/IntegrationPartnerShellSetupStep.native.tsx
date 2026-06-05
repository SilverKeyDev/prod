import { INTEGRATION_PARTNER_TRANSLATIONS } from "packages/features/integrationPartner/types/translations";
import type { OnboardingData } from "packages/features/profile/types/onboarding/onboarding";
import { Box, Text } from "packages/ui/components/structure/primitives";
import Input from "packages/ui/components/structure/primitives/input/Input";

type IntegrationPartnerShellSetupStepProps = {
  formData: OnboardingData;
  updateFormData: (field: keyof OnboardingData | string, value: unknown) => void;
};

export function IntegrationPartnerShellSetupStep({
  formData,
  updateFormData,
}: IntegrationPartnerShellSetupStepProps) {
  return (
    <Box className="gap-4">
      <Text className="text-text-primary text-lg font-semibold">
        {INTEGRATION_PARTNER_TRANSLATIONS.INTEGRATION_PARTNER_SHELL_SETUP_TITLE}
      </Text>
      <Text className="text-text-secondary text-sm leading-snug">
        {INTEGRATION_PARTNER_TRANSLATIONS.INTEGRATION_PARTNER_SHELL_SETUP_SUBTITLE}
      </Text>
      <Text className="text-text-primary text-sm font-medium">
        {INTEGRATION_PARTNER_TRANSLATIONS.INTEGRATION_PARTNER_SHELL_TEST_INPUT_LABEL}
      </Text>
      <Input
        value={formData.workspace_shell_test_input ?? ""}
        onChangeText={(value) => updateFormData("workspace_shell_test_input", value)}
      />
    </Box>
  );
}
