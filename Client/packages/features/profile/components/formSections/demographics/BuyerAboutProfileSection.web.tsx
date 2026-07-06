import React from "react";

import {
  PROFILE_FIELDS_ROW_PROPS,
  ProfileSectionBody,
} from "packages/features/profile/components/layout";
import { BuyerAboutMeStepContent } from "packages/features/profile/components/onboarding/buyer";
import ProfilePictureUpload from "packages/features/profile/components/profilePicture/ProfilePictureUpload";
import {
  FIELD_LABELS,
  type OnboardingData,
  PROFILE_NOT_SPECIFIED_LABEL,
  profileFieldValueClassName,
} from "packages/features/profile/utils";
import { FormFieldLabel as Label } from "packages/ui";
import { Box } from "packages/ui/components/structure/primitives";

import AlignedRow from "@/components/layout/AlignedRow";
import { Input } from "@/components/ui";

export type BuyerAboutProfileSectionProps = {
  formData: OnboardingData;
  isEditMode: boolean;
  updateField: (field: keyof OnboardingData | string, value: unknown) => void;
  hideProfilePicture?: boolean;
  hideName?: boolean;
  /** Native profile: custom photo block; web defaults to ProfilePictureUpload. */
  photoBlock?: React.ReactNode;
  /** Native profile: custom name row; web uses default name input when !hideName. */
  nameBlock?: React.ReactNode;
};

export function BuyerAboutProfileSection({
  formData,
  isEditMode,
  updateField,
  hideProfilePicture = false,
  hideName = false,
  photoBlock,
  nameBlock,
}: BuyerAboutProfileSectionProps) {
  const defaultNameBlock =
    !hideName && nameBlock === undefined ? (
      <AlignedRow
        {...PROFILE_FIELDS_ROW_PROPS}
        items={[
          {
            title: <Label className="mb-0">{FIELD_LABELS.NAME}</Label>,
            content: isEditMode ? (
              <Input
                type="text"
                value={formData.name ?? ""}
                onChange={(e: React.ChangeEvent<HTMLInputElement>) =>
                  updateField("name", e.target.value)
                }
                placeholder="Enter your name"
                className="mt-2"
              />
            ) : (
              <Box className={`mt-2 ${profileFieldValueClassName}`}>
                {formData.name?.trim() || PROFILE_NOT_SPECIFIED_LABEL}
              </Box>
            ),
          },
        ]}
      />
    ) : null;

  return (
    <ProfileSectionBody>
      {!hideProfilePicture &&
        (photoBlock ?? (
          <Box>
            <ProfilePictureUpload />
          </Box>
        ))}
      {nameBlock ?? defaultNameBlock}
      <BuyerAboutMeStepContent
        formData={formData}
        updateField={updateField}
        isEditMode={isEditMode}
        showHeader={false}
      />
    </ProfileSectionBody>
  );
}
