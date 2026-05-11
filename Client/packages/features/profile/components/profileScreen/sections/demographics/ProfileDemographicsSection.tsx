import React from "react";

import { useShowPersonalizationSectionBodyTitle } from "packages/features/profile/components/layout";
import { ProfileReadOnlyValue } from "packages/features/profile/components/profileScreen/sections/shared/ProfileReadOnlyValue";
import { FIELD_LABELS, type OnboardingData } from "packages/features/profile/utils";
import { Input } from "packages/ui";
import { ProfileAvatar } from "packages/ui/components/avatar";
import { Pressable } from "packages/ui/components/primitives";
import { Box } from "packages/ui/components/primitives";
import { Text } from "packages/ui/components/primitives";
import BodyText from "packages/ui/components/text/BodyText";
import Title from "packages/ui/components/text/Title";

/** Agent/buyer choice is immutable and only shown during onboarding; omitted from profile. */

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
  /** User display name for avatar accessibility label */
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
  const showSectionTitle = useShowPersonalizationSectionBodyTitle();

  return (
    <Box className="gap-4">
      {showSectionTitle && <Title size="md">About You</Title>}

      {onUploadPhoto != null && (
        <Box className="gap-3">
          <BodyText size="sm" className="text-text-secondary font-medium">
            Profile picture
          </BodyText>
          <Box className="flex-row flex-wrap items-center gap-4">
            <Box className="bg-primary-muted h-20 w-20 items-center justify-center overflow-hidden rounded-full">
              <ProfileAvatar
                imageUrl={profilePictureUrl}
                label={
                  userDisplayName?.trim() ? `Profile photo, ${userDisplayName.trim()}` : "Profile"
                }
                imageClassName="h-20 w-20 rounded-full"
              />
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

      {/* Row: Name | Age (aligned with other profile sections) */}
      <Box className="flex flex-row flex-wrap gap-4">
        <Box className="min-w-0 flex-1">
          <BodyText size="sm" className="text-text-secondary mb-2 font-medium">
            {FIELD_LABELS.NAME}
          </BodyText>
          {isEditMode ? (
            <Input
              type="text"
              value={formData.name ?? ""}
              onChange={(e) => updateField("name", e.target.value || undefined)}
              placeholder="Enter your full name"
              className="mt-2"
            />
          ) : (
            <Box className="mt-2">
              <ProfileReadOnlyValue value={formData.name} />
            </Box>
          )}
        </Box>
        <Box className="min-w-0 flex-1">
          <BodyText size="sm" className="text-text-secondary mb-2 font-medium">
            {FIELD_LABELS.AGE}
          </BodyText>
          {isEditMode ? (
            <Input
              type="number"
              value={formData.age?.toString() ?? ""}
              onChange={(e) =>
                updateField(
                  "age",
                  e.target.value ? parseInt(e.target.value, 10) || undefined : undefined
                )
              }
              placeholder="Your age"
              className="mt-2"
            />
          ) : (
            <Box className="mt-2">
              <ProfileReadOnlyValue value={formData.age} />
            </Box>
          )}
        </Box>
      </Box>
    </Box>
  );
}
