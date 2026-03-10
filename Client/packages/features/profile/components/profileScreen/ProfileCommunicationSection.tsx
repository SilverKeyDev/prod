import React from "react";

import {
  COMMUNICATION_FREQUENCY_OPTIONS,
  FIELD_LABELS,
  INFORMATION_DETAIL_OPTIONS,
  type OnboardingData,
  SECTION_TITLES,
} from "packages/features/profile/utils";
import { Pressable } from "packages/ui/components/primitives";
import { Box } from "packages/ui/components/primitives";
import { Text } from "packages/ui/components/primitives";
import BodyText from "packages/ui/components/text/BodyText";
import Title from "packages/ui/components/text/Title";

import { ProfileReadOnlyValue } from "./ProfileReadOnlyValue";

function getOptionLabel(
  options: readonly { value: string; label: string }[],
  value?: string
): string {
  if (!value) return "Not specified";
  return options.find((opt) => opt.value === value)?.label ?? "Not specified";
}

type ProfileCommunicationSectionProps = {
  formData: OnboardingData;
  isEditMode: boolean;
  updateField: (field: keyof OnboardingData, value: unknown) => void;
};

export function ProfileCommunicationSection({
  formData,
  isEditMode,
  updateField,
}: ProfileCommunicationSectionProps) {
  return (
    <Box className="gap-4">
      <Title size="md">{SECTION_TITLES.COMMUNICATION_PREFERENCES}</Title>

      <Box>
        <BodyText size="sm" className="mb-2 font-medium text-gray-700">
          {FIELD_LABELS.COMMUNICATION_FREQUENCY}
        </BodyText>
        {isEditMode ? (
          <Box className="flex-row flex-wrap gap-2">
            {COMMUNICATION_FREQUENCY_OPTIONS.map((option) => {
              const selected = formData.communication_frequency === option.value;
              return (
                <Pressable
                  key={option.value}
                  onPress={() => updateField("communication_frequency", option.value)}
                  className={`rounded-full px-4 py-2 ${
                    selected ? "bg-brand-accent" : "border border-gray-200 bg-white"
                  }`}
                >
                  <Text
                    className={`text-sm font-medium ${selected ? "text-white" : "text-gray-800"}`}
                  >
                    {option.label}
                  </Text>
                </Pressable>
              );
            })}
          </Box>
        ) : (
          <ProfileReadOnlyValue
            value={getOptionLabel(
              COMMUNICATION_FREQUENCY_OPTIONS,
              formData.communication_frequency
            )}
          />
        )}
      </Box>

      <Box>
        <BodyText size="sm" className="mb-2 font-medium text-gray-700">
          {FIELD_LABELS.INFORMATION_DETAIL_LEVEL}
        </BodyText>
        {isEditMode ? (
          <Box className="flex-row flex-wrap gap-2">
            {INFORMATION_DETAIL_OPTIONS.map((option) => {
              const selected = formData.information_detail_level === option.value;
              return (
                <Pressable
                  key={option.value}
                  onPress={() => updateField("information_detail_level", option.value)}
                  className={`rounded-full px-4 py-2 ${
                    selected ? "bg-brand-accent" : "border border-gray-200 bg-white"
                  }`}
                >
                  <Text
                    className={`text-sm font-medium ${selected ? "text-white" : "text-gray-800"}`}
                  >
                    {option.label}
                  </Text>
                </Pressable>
              );
            })}
          </Box>
        ) : (
          <ProfileReadOnlyValue
            value={getOptionLabel(INFORMATION_DETAIL_OPTIONS, formData.information_detail_level)}
          />
        )}
      </Box>
    </Box>
  );
}
