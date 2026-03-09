import React from "react";

import Input from "@ui/form/Input";

import {
  FIELD_LABELS,
  IS_AGENT_OPTIONS,
  type OnboardingData,
} from "packages/features/profile/utils";
import { Pressable } from "packages/ui/components/primitives";
import { Box } from "packages/ui/components/primitives";
import { Image } from "packages/ui/components/primitives";
import { Text } from "packages/ui/components/primitives";
import BodyText from "packages/ui/components/text/BodyText";
import Title from "packages/ui/components/text/Title";
import { MOBILE_TEXT_INPUT_CLASS } from "packages/ui/styles/nativeFormStyles.native";

import { ProfileReadOnlyValue } from "./ProfileReadOnlyValue.native";

function getOptionLabel(
  options: readonly { value: string; label: string }[],
  value?: string
): string {
  if (!value) return "Not specified";
  return options.find((opt) => opt.value === value)?.label ?? "Not specified";
}

function getInitials(name?: string | null): string | null {
  if (!name) return null;
  const trimmed = name.trim();
  if (!trimmed) return null;
  return trimmed.charAt(0).toUpperCase();
}

type ProfileDemographicsSectionProps = {
  formData: OnboardingData;
  isEditMode: boolean;
  updateField: (field: keyof OnboardingData, value: unknown) => void;
  /** Profile picture URL for avatar display (mirrors web DemographicsSection) */
  profilePictureUrl?: string | null;
  /** Callback to trigger profile photo upload (e.g. DocumentPicker) */
  onUploadPhoto?: () => void | Promise<void>;
  /** Whether upload is in progress */
  isUploadingProfilePicture?: boolean;
  /** Error from last upload attempt */
  profilePictureError?: { message: string } | null;
  /** User display name for initials fallback */
  userDisplayName?: string | null;
};

export function ProfileDemographicsSection({
  formData,
  isEditMode,
  updateField,
  profilePictureUrl,
  onUploadPhoto,
  isUploadingProfilePicture = false,
  profilePictureError,
  userDisplayName,
}: ProfileDemographicsSectionProps) {
  return (
    <Box className="gap-4">
      <Title size="md">About You</Title>

      {onUploadPhoto != null && (
        <Box className="gap-3">
          <BodyText size="sm" className="font-medium text-gray-700">
            Profile picture
          </BodyText>
          <Box className="flex-row flex-wrap items-center gap-4">
            <Box className="h-20 w-20 items-center justify-center overflow-hidden rounded-full bg-gray-100">
              {profilePictureUrl ? (
                <Image source={{ uri: profilePictureUrl }} className="h-20 w-20 rounded-full" />
              ) : (
                <Text className="text-xl font-semibold text-gray-700">
                  {getInitials(userDisplayName) ?? "?"}
                </Text>
              )}
            </Box>
            <Box className="gap-1">
              <Pressable
                onPress={onUploadPhoto}
                disabled={isUploadingProfilePicture}
                className="rounded-lg border border-gray-300 bg-white px-4 py-2"
              >
                <Text className="text-sm font-medium text-gray-900">
                  {profilePictureUrl ? "Change photo" : "Upload photo"}
                </Text>
              </Pressable>
              {profilePictureError != null && (
                <Text className="text-xs text-red-500">{profilePictureError.message}</Text>
              )}
            </Box>
          </Box>
        </Box>
      )}

      <Box>
        <BodyText size="sm" className="mb-2 font-medium text-gray-700">
          {FIELD_LABELS.NAME}
        </BodyText>
        {isEditMode ? (
          <Input
            value={formData.name ?? ""}
            onValueChange={(v) => updateField("name", v || undefined)}
            placeholder="Your name"
            keyboardType="default"
            className={MOBILE_TEXT_INPUT_CLASS}
          />
        ) : (
          <ProfileReadOnlyValue value={formData.name} />
        )}
      </Box>

      <Box>
        <BodyText size="sm" className="mb-2 font-medium text-gray-700">
          {FIELD_LABELS.IS_AGENT}
        </BodyText>
        {isEditMode ? (
          <Box className="flex-row flex-wrap gap-2">
            {IS_AGENT_OPTIONS.map((option) => {
              const selected = formData.is_agent === option.value;
              return (
                <Pressable
                  key={option.value}
                  onPress={() => updateField("is_agent", option.value)}
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
          <ProfileReadOnlyValue value={getOptionLabel(IS_AGENT_OPTIONS, formData.is_agent)} />
        )}
      </Box>

      <Box>
        <BodyText size="sm" className="mb-2 font-medium text-gray-700">
          {FIELD_LABELS.AGE}
        </BodyText>
        {isEditMode ? (
          <Input
            value={formData.age?.toString() ?? ""}
            onValueChange={(v) => updateField("age", v ? parseInt(v, 10) || undefined : undefined)}
            placeholder="Age"
            keyboardType="number-pad"
            className="rounded-lg border border-gray-200 bg-white px-4 py-3 text-base text-gray-900"
          />
        ) : (
          <ProfileReadOnlyValue value={formData.age} />
        )}
      </Box>
    </Box>
  );
}
