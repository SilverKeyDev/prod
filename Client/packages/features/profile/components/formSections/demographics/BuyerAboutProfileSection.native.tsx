import React from "react";

import { BuyerAboutMeStepContent } from "packages/features/profile/components/onboarding/buyer";
import { ProfileReadOnlyValue } from "packages/features/profile/components/profileScreen/tabs/shared/ProfileReadOnlyValue";
import { FIELD_LABELS, type OnboardingData } from "packages/features/profile/utils";
import { Input } from "packages/ui";
import { ProfileAvatar } from "packages/ui/components/media/avatar";
import { Box, Pressable, Text } from "packages/ui/components/structure/primitives";
import BodyText from "packages/ui/components/structure/text/BodyText";

export type BuyerAboutProfileSectionProps = {
  formData: OnboardingData;
  isEditMode: boolean;
  updateField: (field: keyof OnboardingData | string, value: unknown) => void;
  profilePictureUrl?: string | null;
  onUploadPhoto?: () => void | Promise<void>;
  isUploadingProfilePicture?: boolean;
  profilePictureError?: { message: string } | null;
  userDisplayName?: string | null;
};

export function BuyerAboutProfileSection({
  formData,
  isEditMode,
  updateField,
  profilePictureUrl,
  onUploadPhoto,
  isUploadingProfilePicture = false,
  profilePictureError,
  userDisplayName,
}: BuyerAboutProfileSectionProps) {
  return (
    <Box className="gap-4">
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
      </Box>
      <BuyerAboutMeStepContent
        formData={formData}
        updateField={updateField}
        isEditMode={isEditMode}
        showHeader={false}
      />
    </Box>
  );
}
