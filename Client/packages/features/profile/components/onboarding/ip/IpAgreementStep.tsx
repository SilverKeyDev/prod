/**
 * IpAgreementStep — SIL-193
 * Integration partner agreement acknowledgement.
 */
import React from "react";

import { INTEGRATION_PARTNER_TRANSLATIONS } from "packages/features/integrationPartner/types/translations";
import type { OnboardingData } from "packages/features/profile/types/onboarding/onboarding";
import { Button } from "packages/ui";
import OliveCheckbox from "packages/ui/components/inputs/form/checkbox/OliveCheckbox";
import { Box } from "packages/ui/components/structure/primitives";
import BodyText from "packages/ui/components/structure/text/BodyText";
import Title from "packages/ui/components/structure/text/Title";

type Props = {
  formData: OnboardingData;
  updateFormData: (field: keyof OnboardingData, value: unknown) => void;
};

export function IpAgreementStep({ formData, updateFormData }: Props) {
  const agreed = formData.ip_agreement_acknowledged === true;
  return (
    <Box className="flex flex-col gap-6">
      <Box>
        <Title size="md" as="h2">
          {INTEGRATION_PARTNER_TRANSLATIONS.IP_AGREEMENT_TITLE}
        </Title>
        <BodyText size="sm" muted className="mt-1">
          {INTEGRATION_PARTNER_TRANSLATIONS.IP_AGREEMENT_SUBTITLE}
        </BodyText>
      </Box>
      <Box className="border-border rounded-xl border p-5">
        <BodyText size="sm" muted className="leading-relaxed">
          By completing this onboarding, you confirm that your organization is authorized to offer
          ancillary real estate services and agrees to SilverKey&apos;s integration partner terms.
          SilverKey will use the information provided to configure your integration and connect you
          with relevant brokerage partners. Data is handled per our Privacy Policy.
        </BodyText>
      </Box>
      {/* Button (not TouchableBox) so the row carries checkbox semantics on both platforms —
          TouchableBox hardcodes role="button". OliveCheckbox is presentational here: it only
          reacts to onToggle, which React Native would ignore on its underlying View, so the
          whole row owns the press instead. */}
      <Button
        type="button"
        variant="ghost"
        label={INTEGRATION_PARTNER_TRANSLATIONS.IP_AGREEMENT_CHECKBOX_LABEL}
        accessibilityRole="checkbox"
        accessibilityState={{ checked: agreed }}
        onPress={() => updateFormData("ip_agreement_acknowledged", !agreed)}
        contentAlign="start"
        className="flex flex-row items-start gap-3 px-0 py-0"
      >
        <OliveCheckbox checked={agreed} />
        <BodyText size="sm" className="text-text-secondary flex-1 text-left">
          {INTEGRATION_PARTNER_TRANSLATIONS.IP_AGREEMENT_CHECKBOX_LABEL}
        </BodyText>
      </Button>
    </Box>
  );
}
