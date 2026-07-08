import React from "react";

import {
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
import { FormFieldLabel as Label, TagInput } from "packages/ui";
import { Box } from "packages/ui/components/structure/primitives";

import { Input, Title } from "@/components/ui";

import AgentTestimonialsSection from "./AgentTestimonialsSection";

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
  const showSectionTitle = useShowPersonalizationSectionBodyTitle();

  return (
    <>
      {showSectionTitle && (
        <Title size="md" as="h2" className="mb-6">
          {SECTION_TITLES.AGENT_PROFILE_AND_SERVICE}
        </Title>
      )}

      <ProfileSectionBody>
        <ProfileFullWidthField
          label={<Label className="block">{FIELD_LABELS.AGENT_BIO}</Label>}
        >
          {isEditMode ? (
            <Input
              type="text"
              value={formData.agent_bio ?? ""}
              onChange={(e: React.ChangeEvent<HTMLInputElement>) =>
                updateFormData("agent_bio", e.target.value)
              }
              placeholder="Short professional bio"
            />
          ) : (
            <Box
              className={`mobile-input bg-background-base ${profileFieldValueClassName(
                formData.agent_bio,
              )}`}
            >
              {formData.agent_bio ?? PROFILE_NOT_SPECIFIED_LABEL}
            </Box>
          )}
        </ProfileFullWidthField>

        <ProfileFullWidthField
          label={
            <Label className="block">
              {FIELD_LABELS.AGENT_PRIMARY_SERVICE_ZIPS}
            </Label>
          }
        >
          <TagInput
            value={formData.agent_primary_service_zips ?? []}
            onChange={(v) => updateFormData("agent_primary_service_zips", v)}
            placeholder="e.g. 90210"
            isEditMode={isEditMode}
          />
        </ProfileFullWidthField>

        <ProfileFullWidthField
          label={
            <Label className="block">{FIELD_LABELS.AGENT_SPECIALTIES}</Label>
          }
        >
          <TagInput
            value={formData.agent_specialties ?? []}
            onChange={(v) => updateFormData("agent_specialties", v)}
            placeholder="e.g. First-time buyers, Luxury"
            isEditMode={isEditMode}
          />
        </ProfileFullWidthField>

        <ProfileFullWidthField
          label={
            <Label className="block">{FIELD_LABELS.AGENT_TESTIMONIALS}</Label>
          }
        >
          <AgentTestimonialsSection
            formData={formData}
            isEditMode={isEditMode}
            updateFormData={updateFormData}
          />
        </ProfileFullWidthField>
      </ProfileSectionBody>
    </>
  );
}
