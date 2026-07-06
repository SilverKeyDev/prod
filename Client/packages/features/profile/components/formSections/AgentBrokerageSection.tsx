import React from "react";

import {
  PROFILE_FIELDS_ROW_PROPS,
  ProfileFullWidthField,
  ProfileSectionBody,
  useShowPersonalizationSectionBodyTitle,
} from "packages/features/profile/components/layout";
import {
  FIELD_LABELS,
  type OnboardingData,
  PROFILE_NOT_SPECIFIED_LABEL,
  profileFieldValueClassName,
  SECTION_TITLES,
} from "packages/features/profile/utils";
import { FormFieldLabel as Label } from "packages/ui";
import { Box } from "packages/ui/components/structure/primitives";

import AlignedRow from "@/components/layout/AlignedRow";
import { Input, Title } from "@/components/ui";

export type AgentBrokerageSectionProps = {
  formData: OnboardingData;
  isEditMode: boolean;
  updateFormData: (field: keyof OnboardingData, value: unknown) => void;
  /** Optional id for the section heading (e.g. aria-labelledby). */
  titleId?: string;
};

export default function AgentBrokerageSection({
  formData,
  isEditMode,
  updateFormData,
  titleId,
}: AgentBrokerageSectionProps) {
  const showSectionTitle = useShowPersonalizationSectionBodyTitle();

  return (
    <>
      {showSectionTitle && (
        <Title size="md" as="h2" className="mb-6" id={titleId}>
          {SECTION_TITLES.AGENT_BROKERAGE}
        </Title>
      )}

      <ProfileSectionBody>
        <AlignedRow
          {...PROFILE_FIELDS_ROW_PROPS}
          items={[
            {
              title: <Label>{FIELD_LABELS.AGENT_BROKERAGE_NAME}</Label>,
              content: isEditMode ? (
                <Input
                  type="text"
                  value={formData.agent_brokerage_name ?? ""}
                  onChange={(e: React.ChangeEvent<HTMLInputElement>) =>
                    updateFormData("agent_brokerage_name", e.target.value)
                  }
                  placeholder="Brokerage name"
                  className="mt-2"
                />
              ) : (
                <Box
                  className={`mobile-input bg-background-base mt-2 ${profileFieldValueClassName(
                    formData.agent_brokerage_name
                  )}`}
                >
                  {formData.agent_brokerage_name ?? PROFILE_NOT_SPECIFIED_LABEL}
                </Box>
              ),
            },
            {
              title: <Label>{FIELD_LABELS.AGENT_BROKERAGE_BIC}</Label>,
              content: isEditMode ? (
                <Input
                  type="text"
                  value={formData.agent_brokerage_bic_name ?? ""}
                  onChange={(e: React.ChangeEvent<HTMLInputElement>) =>
                    updateFormData("agent_brokerage_bic_name", e.target.value)
                  }
                  placeholder="Broker-in-charge name"
                  className="mt-2"
                />
              ) : (
                <Box
                  className={`mobile-input bg-background-base mt-2 ${profileFieldValueClassName(
                    formData.agent_brokerage_bic_name
                  )}`}
                >
                  {formData.agent_brokerage_bic_name ?? PROFILE_NOT_SPECIFIED_LABEL}
                </Box>
              ),
            },
          ]}
        />

        <ProfileFullWidthField
          label={<Label className="block">{FIELD_LABELS.AGENT_BROKERAGE_ADDRESS}</Label>}
        >
          {isEditMode ? (
            <Input
              type="text"
              value={formData.agent_brokerage_address ?? ""}
              onChange={(e: React.ChangeEvent<HTMLInputElement>) =>
                updateFormData("agent_brokerage_address", e.target.value)
              }
              placeholder="Office address"
            />
          ) : (
            <Box
              className={`mobile-input bg-background-base ${profileFieldValueClassName(
                formData.agent_brokerage_address
              )}`}
            >
              {formData.agent_brokerage_address ?? PROFILE_NOT_SPECIFIED_LABEL}
            </Box>
          )}
        </ProfileFullWidthField>

        <AlignedRow
          {...PROFILE_FIELDS_ROW_PROPS}
          items={[
            {
              title: <Label>{FIELD_LABELS.AGENT_BROKERAGE_EMAIL}</Label>,
              content: isEditMode ? (
                <Input
                  type="email"
                  value={formData.agent_brokerage_email ?? ""}
                  onChange={(e: React.ChangeEvent<HTMLInputElement>) =>
                    updateFormData("agent_brokerage_email", e.target.value)
                  }
                  placeholder="Office email"
                  className="mt-2"
                />
              ) : (
                <Box
                  className={`mobile-input bg-background-base mt-2 ${profileFieldValueClassName(
                    formData.agent_brokerage_email
                  )}`}
                >
                  {formData.agent_brokerage_email ?? PROFILE_NOT_SPECIFIED_LABEL}
                </Box>
              ),
            },
            {
              title: <Label>{FIELD_LABELS.AGENT_BROKERAGE_PHONE}</Label>,
              content: isEditMode ? (
                <Input
                  type="tel"
                  value={formData.agent_brokerage_phone ?? ""}
                  onChange={(e: React.ChangeEvent<HTMLInputElement>) =>
                    updateFormData("agent_brokerage_phone", e.target.value)
                  }
                  placeholder="Office phone"
                  className="mt-2"
                />
              ) : (
                <Box
                  className={`mobile-input bg-background-base mt-2 ${profileFieldValueClassName(
                    formData.agent_brokerage_phone
                  )}`}
                >
                  {formData.agent_brokerage_phone ?? PROFILE_NOT_SPECIFIED_LABEL}
                </Box>
              ),
            },
          ]}
        />

        <ProfileFullWidthField
          label={<Label className="block">{FIELD_LABELS.AGENT_PHYSICAL_MAILING_ADDRESS}</Label>}
        >
          {isEditMode ? (
            <Input
              type="text"
              value={formData.agent_physical_mailing_address ?? ""}
              onChange={(e: React.ChangeEvent<HTMLInputElement>) =>
                updateFormData("agent_physical_mailing_address", e.target.value)
              }
              placeholder="Mailing address (if different)"
            />
          ) : (
            <Box
              className={`mobile-input bg-background-base ${profileFieldValueClassName(
                formData.agent_physical_mailing_address
              )}`}
            >
              {formData.agent_physical_mailing_address ?? PROFILE_NOT_SPECIFIED_LABEL}
            </Box>
          )}
        </ProfileFullWidthField>
      </ProfileSectionBody>
    </>
  );
}
