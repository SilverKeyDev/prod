import React from "react";

import {
  ProfileSectionBody,
  useHidePersonalizationStepHeading,
} from "packages/features/profile/components/layout";
import { Box } from "packages/ui/components/primitives";

import { Input, Title } from "@/components/ui";
import Label from "@/features/profile/components/settings/inputs/Label";
import TagInput from "@/features/profile/components/settings/inputs/TagInput.web";
import {
  FIELD_LABELS,
  type OnboardingData,
  PROFILE_NOT_SPECIFIED_LABEL,
  profileFieldValueClassName,
  SECTION_TITLES,
} from "@/features/profile/utils";

export type AgentProfileServiceSectionProps = {
  formData: OnboardingData;
  isEditMode: boolean;
  updateFormData: (field: keyof OnboardingData, value: unknown) => void;
};

export default function AgentProfileServiceSection({
  formData,
  isEditMode,
  updateFormData,
}: AgentProfileServiceSectionProps) {
  const hideStepHeading = useHidePersonalizationStepHeading();

  return (
    <>
      {!hideStepHeading && (
        <Title size="md" as="h2" className="mb-6">
          {SECTION_TITLES.AGENT_PROFILE_AND_SERVICE}
        </Title>
      )}

      <ProfileSectionBody>
        <Box>
          <Label className="mb-2 block">{FIELD_LABELS.AGENT_BIO}</Label>
          {isEditMode ? (
            <Input
              type="text"
              value={formData.agent_bio ?? ""}
              onChange={(e: React.ChangeEvent<HTMLInputElement>) =>
                updateFormData("agent_bio", e.target.value)
              }
              placeholder="Short bio"
              className="mt-2"
            />
          ) : (
            <Box
              className={`mobile-input bg-background-base mt-2 ${profileFieldValueClassName(
                formData.agent_bio,
              )}`}
            >
              {formData.agent_bio ?? PROFILE_NOT_SPECIFIED_LABEL}
            </Box>
          )}
        </Box>

        <Box>
          <Label className="mb-2 block">
            {FIELD_LABELS.AGENT_PRIMARY_SERVICE_ZIPS}
          </Label>
          <TagInput
            value={formData.agent_primary_service_zips ?? []}
            onChange={(v) => updateFormData("agent_primary_service_zips", v)}
            placeholder="e.g. 90210"
            isEditMode={isEditMode}
          />
        </Box>

        <Box>
          <Label className="mb-2 block">{FIELD_LABELS.AGENT_SPECIALTIES}</Label>
          <TagInput
            value={formData.agent_specialties ?? []}
            onChange={(v) => updateFormData("agent_specialties", v)}
            placeholder="e.g. First-time buyers, Luxury"
            isEditMode={isEditMode}
          />
        </Box>
      </ProfileSectionBody>
    </>
  );
}
