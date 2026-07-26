/**
 * IpAgreementStep — SIL-193
 * Integration partner agreement acknowledgement.
 */
import React from "react";
import type { OnboardingData } from "packages/features/profile/types/onboarding/onboarding";
import { INTEGRATION_PARTNER_TRANSLATIONS } from "packages/features/integrationPartner/types/translations";
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
          ancillary real estate services and agrees to SilverKey's integration partner terms.
          SilverKey will use the information provided to configure your integration and connect
          you with relevant brokerage partners. Data is handled per our Privacy Policy.
        </BodyText>
      </Box>
      <Box className="flex items-start gap-3">
        <input
          id="ip-agreement"
          type="checkbox"
          checked={agreed}
          onChange={(e) => updateFormData("ip_agreement_acknowledged", e.target.checked)}
          className="mt-0.5 h-4 w-4 cursor-pointer rounded border-gray-300"
        />
        <label htmlFor="ip-agreement" className="cursor-pointer text-sm text-gray-700">
          {INTEGRATION_PARTNER_TRANSLATIONS.IP_AGREEMENT_CHECKBOX_LABEL}
        </label>
      </Box>
    </Box>
  );
}