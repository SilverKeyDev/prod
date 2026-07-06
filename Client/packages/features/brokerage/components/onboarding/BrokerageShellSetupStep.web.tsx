import { BROKERAGE_TRANSLATIONS } from "packages/features/brokerage/types/translations";
import type { OnboardingData } from "packages/features/profile/types/onboarding/onboarding";
import { Box } from "packages/ui/components/structure/primitives";

import { BodyText, Input, Title } from "@/components/ui";

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

      <Box className="grid gap-4 sm:grid-cols-2">
        <Input
          label="Legal business name"
          value={formData.brokerage_legal_business_name ?? ""}
          onChange={(event) => updateFormData("brokerage_legal_business_name", event.target.value)}
        />

        <Input
          label="Primary admin name"
          value={formData.brokerage_primary_admin_name ?? ""}
          onChange={(event) => updateFormData("brokerage_primary_admin_name", event.target.value)}
        />

        <Input
          label="Primary admin email"
          type="email"
          value={formData.brokerage_primary_admin_email ?? ""}
          onChange={(event) => updateFormData("brokerage_primary_admin_email", event.target.value)}
        />

        <Input
          label="Primary admin phone"
          value={formData.brokerage_primary_admin_phone ?? ""}
          onChange={(event) => updateFormData("brokerage_primary_admin_phone", event.target.value)}
        />

        <Input
          label="Primary admin title"
          value={formData.brokerage_primary_admin_title ?? ""}
          onChange={(event) => updateFormData("brokerage_primary_admin_title", event.target.value)}
        />

        <Input
          label="License number"
          value={formData.brokerage_license_number ?? ""}
          onChange={(event) => updateFormData("brokerage_license_number", event.target.value)}
        />
      </Box>
    </Box>
  );
}
