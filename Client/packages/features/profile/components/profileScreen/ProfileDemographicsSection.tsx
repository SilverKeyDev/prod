import React from "react";

import { FIELD_LABELS, type OnboardingData } from "packages/features/profile/utils";
import { PrimitiveInput } from "packages/ui/components/primitives";
import { Pressable } from "packages/ui/components/primitives";
import { Box } from "packages/ui/components/primitives";
import { Image } from "packages/ui/components/primitives";
import { Text } from "packages/ui/components/primitives";
import BodyText from "packages/ui/components/text/BodyText";
import Title from "packages/ui/components/text/Title";

import { ProfileReadOnlyValue } from "./ProfileReadOnlyValue";

/** Agent/buyer choice is immutable and only shown during onboarding; omitted from profile. */

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
          <BodyText size="sm" className="text-text-secondary font-medium">
            Profile picture
          </BodyText>
          <Box className="flex-row flex-wrap items-center gap-4">
            <Box className="bg-primary-muted h-20 w-20 items-center justify-center overflow-hidden rounded-full">
              {profilePictureUrl ? (
                <Image source={{ uri: profilePictureUrl }} className="h-20 w-20 rounded-full" />
              ) : (
                <Text className="text-text-secondary text-xl font-semibold">
                  {getInitials(userDisplayName) ?? "?"}
                </Text>
              )}
            </Box>
            <Box className="gap-1">
              <Pressable
                onPress={onUploadPhoto}
                disabled={isUploadingProfilePicture}
                className="border-border bg-background-surface rounded-lg border px-4 py-2"
              >
                <Text className="text-text-primary text-sm font-medium">
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
        <BodyText size="sm" className="text-text-secondary mb-2 font-medium">
          {FIELD_LABELS.NAME}
        </BodyText>
        {isEditMode ? (
          <PrimitiveInput
            value={formData.name ?? ""}
            onValueChange={(v) => updateField("name", v || undefined)}
            placeholder="Your name"
            keyboardType="default"
            className="border-border bg-background-surface text-text-primary rounded-lg border px-4 py-3 text-base"
          />
        ) : (
          <ProfileReadOnlyValue value={formData.name} />
        )}
      </Box>

      <Box>
        <BodyText size="sm" className="text-text-secondary mb-2 font-medium">
          {FIELD_LABELS.AGE}
        </BodyText>
        {isEditMode ? (
          <PrimitiveInput
            value={formData.age?.toString() ?? ""}
            onValueChange={(v) => updateField("age", v ? parseInt(v, 10) || undefined : undefined)}
            placeholder="Age"
            keyboardType="number-pad"
            className="border-border bg-background-surface text-text-primary rounded-lg border px-4 py-3 text-base"
          />
        ) : (
          <ProfileReadOnlyValue value={formData.age} />
        )}
      </Box>
    </Box>
  );
}
