import React from "react";

import { Box } from "packages/ui/components/primitives";

import AlignedRow from "@/components/layout/AlignedRow";
import Card from "@/components/layout/Card.web";
import { Input, Title } from "@/components/ui";
import Label from "@/features/profile/components/settings/inputs/Label";
import {
  FIELD_LABELS,
  type OnboardingData,
  PROFILE_NOT_SPECIFIED_LABEL,
  profileFieldValueClassName,
  SECTION_TITLES,
} from "@/features/profile/utils";

export type AgentBrokerageSectionProps = {
  formData: OnboardingData;
  isEditMode: boolean;
  updateFormData: (field: string | number | symbol, value: unknown) => void;
  /** When false, render without Card (e.g. onboarding). Default true. */
  wrapInCard?: boolean;
  /** Optional id for the section heading (e.g. aria-labelledby). */
  titleId?: string;
};

export default function AgentBrokerageSection({
  formData,
  isEditMode,
  updateFormData,
  wrapInCard = true,
  titleId,
}: AgentBrokerageSectionProps) {
  const content = (
    <>
      <Title size="md" as="h2" className="mb-6" id={titleId}>
        {SECTION_TITLES.AGENT_BROKERAGE}
      </Title>

      <Box className="space-y-6">
        <AlignedRow
          breakIntoRows="md"
          gap="lg"
          justify="start"
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
                  className={`mobile-input bg-background-base mt-2 ${profileFieldValueClassName(formData.agent_brokerage_name)}`}
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
                  placeholder="BIC name"
                  className="mt-2"
                />
              ) : (
                <Box
                  className={`mobile-input bg-background-base mt-2 ${profileFieldValueClassName(formData.agent_brokerage_bic_name)}`}
                >
                  {formData.agent_brokerage_bic_name ?? PROFILE_NOT_SPECIFIED_LABEL}
                </Box>
              ),
            },
          ]}
        />

        <Box>
          <Label className="mb-2 block">{FIELD_LABELS.AGENT_BROKERAGE_ADDRESS}</Label>
          {isEditMode ? (
            <Input
              type="text"
              value={formData.agent_brokerage_address ?? ""}
              onChange={(e: React.ChangeEvent<HTMLInputElement>) =>
                updateFormData("agent_brokerage_address", e.target.value)
              }
              placeholder="Address"
              className="mt-2"
            />
          ) : (
            <Box
              className={`mobile-input bg-background-base mt-2 ${profileFieldValueClassName(formData.agent_brokerage_address)}`}
            >
              {formData.agent_brokerage_address ?? PROFILE_NOT_SPECIFIED_LABEL}
            </Box>
          )}
        </Box>

        <AlignedRow
          breakIntoRows="md"
          gap="lg"
          justify="start"
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
                  placeholder="Email"
                  className="mt-2"
                />
              ) : (
                <Box
                  className={`mobile-input bg-background-base mt-2 ${profileFieldValueClassName(formData.agent_brokerage_email)}`}
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
                  placeholder="Phone"
                  className="mt-2"
                />
              ) : (
                <Box
                  className={`mobile-input bg-background-base mt-2 ${profileFieldValueClassName(formData.agent_brokerage_phone)}`}
                >
                  {formData.agent_brokerage_phone ?? PROFILE_NOT_SPECIFIED_LABEL}
                </Box>
              ),
            },
          ]}
        />

        <Box>
          <Label className="mb-2 block">{FIELD_LABELS.AGENT_PHYSICAL_MAILING_ADDRESS}</Label>
          {isEditMode ? (
            <Input
              type="text"
              value={formData.agent_physical_mailing_address ?? ""}
              onChange={(e: React.ChangeEvent<HTMLInputElement>) =>
                updateFormData("agent_physical_mailing_address", e.target.value)
              }
              placeholder="Mailing address"
              className="mt-2"
            />
          ) : (
            <Box
              className={`mobile-input bg-background-base mt-2 ${profileFieldValueClassName(formData.agent_physical_mailing_address)}`}
            >
              {formData.agent_physical_mailing_address ?? PROFILE_NOT_SPECIFIED_LABEL}
            </Box>
          )}
        </Box>
      </Box>
    </>
  );

  if (wrapInCard) {
    return (
      <Card border="light" className="mb-6">
        {content}
      </Card>
    );
  }
  return <Box>{content}</Box>;
}
