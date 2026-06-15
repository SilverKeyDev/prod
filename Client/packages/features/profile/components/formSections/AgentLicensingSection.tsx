import React from "react";

import {
  ProfileFullWidthField,
  ProfileSectionBody,
  useShowPersonalizationSectionBodyTitle,
} from "packages/features/profile/components/layout";
import { FIELD_LABELS, type OnboardingData, SECTION_TITLES } from "packages/features/profile/utils";
import { FormFieldLabel as Label, TagInput } from "packages/ui";

import { Title } from "@/components/ui";

export type AgentLicensingSectionProps = {
  formData: OnboardingData;
  isEditMode: boolean;
  updateFormData: (field: keyof OnboardingData, value: unknown) => void;
};

export default function AgentLicensingSection({
  formData,
  isEditMode,
  updateFormData,
}: AgentLicensingSectionProps) {
  const showSectionTitle = useShowPersonalizationSectionBodyTitle();

  return (
    <>
      {showSectionTitle && (
        <Title size="md" as="h2" className="mb-6">
          {SECTION_TITLES.AGENT_LICENSING}
        </Title>
      )}

      <ProfileSectionBody>
        <ProfileFullWidthField
          label={<Label className="block">{FIELD_LABELS.AGENT_LICENSED_STATES}</Label>}
        >
          <TagInput
            value={formData.agent_licensed_states ?? []}
            onChange={(v) => updateFormData("agent_licensed_states", v)}
            placeholder="e.g. CA, TX"
            isEditMode={isEditMode}
          />
        </ProfileFullWidthField>

        <ProfileFullWidthField
          label={<Label className="block">{FIELD_LABELS.AGENT_LICENSE_NUMBERS}</Label>}
        >
          <TagInput
            value={formData.agent_license_numbers ?? []}
            onChange={(v) => updateFormData("agent_license_numbers", v)}
            placeholder="License number"
            isEditMode={isEditMode}
          />
        </ProfileFullWidthField>

        <ProfileFullWidthField
          label={<Label className="block">{FIELD_LABELS.AGENT_LICENSE_TYPES}</Label>}
        >
          <TagInput
            value={formData.agent_license_types ?? []}
            onChange={(v) => updateFormData("agent_license_types", v)}
            placeholder="e.g. Salesperson, Broker"
            isEditMode={isEditMode}
          />
        </ProfileFullWidthField>

        <ProfileFullWidthField
          label={<Label className="block">{FIELD_LABELS.AGENT_LICENSE_EXPIRATION_DATES}</Label>}
        >
          <TagInput
            value={formData.agent_license_expiration_dates ?? []}
            onChange={(v) => updateFormData("agent_license_expiration_dates", v)}
            placeholder="e.g. 2025-12-31"
            isEditMode={isEditMode}
          />
        </ProfileFullWidthField>
      </ProfileSectionBody>
    </>
  );
}
