import type { OnboardingData } from "packages/features/profile/types/onboarding/onboarding";
import { SELLER_TRANSLATIONS } from "packages/features/seller/types/translations";
import { Box, Text } from "packages/ui/components/structure/primitives";
import Input from "packages/ui/components/structure/primitives/input/Input";

type SellerShellSetupStepProps = {
  formData: OnboardingData;
  updateFormData: (field: keyof OnboardingData | string, value: unknown) => void;
};

export function SellerShellSetupStep({ formData, updateFormData }: SellerShellSetupStepProps) {
  return (
    <Box className="gap-4">
      <Text className="text-text-primary text-lg font-semibold">
        {SELLER_TRANSLATIONS.SELLER_SHELL_SETUP_TITLE}
      </Text>
      <Text className="text-text-secondary text-sm leading-snug">
        {SELLER_TRANSLATIONS.SELLER_SHELL_SETUP_SUBTITLE}
      </Text>
      <Text className="text-text-primary text-sm font-medium">
        {SELLER_TRANSLATIONS.SELLER_SHELL_TEST_INPUT_LABEL}
      </Text>
      <Input
        value={formData.workspace_shell_test_input ?? ""}
        onChangeText={(value) => updateFormData("workspace_shell_test_input", value)}
      />
    </Box>
  );
}
