import React from "react";

import {
  ARCHITECTURAL_STYLE_OPTIONS,
  FIELD_LABELS,
  INTENDED_USE_OPTIONS,
  type OnboardingData,
  PROFILE_NOT_SPECIFIED_LABEL,
  profileFieldValueClassName,
  RENOVATION_PREFERENCE_OPTIONS,
} from "packages/features/profile/utils";
import { WALKABILITY_OPTIONS } from "packages/features/profile/utils/public/constants";
import { FormFieldLabel as Label } from "packages/ui";
import { Box } from "packages/ui/components/structure/primitives";

import AlignedRow from "@/components/layout/AlignedRow";
import { Dropdown } from "@/components/ui";
type HousingDropdownRowsProps = {
  formData: OnboardingData;
  isEditMode: boolean;
  updateFormData: (field: keyof OnboardingData, value: unknown) => void;
  /** Hide fields shown elsewhere in the same form (e.g. walkability in Location section). */
  omitFields?: Array<"walkability">;
};

export function HousingDropdownRows({
  formData,
  isEditMode,
  updateFormData,
  omitFields,
}: HousingDropdownRowsProps) {
  const omitWalkability = omitFields?.includes("walkability") ?? false;

  const firstRowItems = [
    {
      title: <Label>{FIELD_LABELS.PREFERRED_ARCHITECTURAL_STYLE}</Label>,
      content: isEditMode ? (
        <Dropdown
          value={formData.preferred_architectural_style ?? ""}
          onChange={(value) => updateFormData("preferred_architectural_style", value)}
          options={ARCHITECTURAL_STYLE_OPTIONS}
          placeholder="Select architectural style"
        />
      ) : (
        <Box
          className={`mobile-input bg-background-base ${profileFieldValueClassName(
            formData.preferred_architectural_style
          )}`}
        >
          {formData.preferred_architectural_style
            ? ARCHITECTURAL_STYLE_OPTIONS.find(
                (opt) => opt.value === formData.preferred_architectural_style
              )?.label
            : PROFILE_NOT_SPECIFIED_LABEL}
        </Box>
      ),
    },
    ...(omitWalkability
      ? []
      : [
          {
            title: <Label>{FIELD_LABELS.WALKABILITY_IMPORTANCE}</Label>,
            content: isEditMode ? (
              <Dropdown
                value={formData.walkability_importance ?? ""}
                onChange={(value) => updateFormData("walkability_importance", value)}
                options={WALKABILITY_OPTIONS}
                placeholder="Select walkability importance"
              />
            ) : (
              <Box
                className={`mobile-input bg-background-base ${profileFieldValueClassName(
                  formData.walkability_importance
                )}`}
              >
                {formData.walkability_importance
                  ? WALKABILITY_OPTIONS.find((opt) => opt.value === formData.walkability_importance)
                      ?.label
                  : PROFILE_NOT_SPECIFIED_LABEL}
              </Box>
            ),
          },
        ]),
    {
      title: <Label>{FIELD_LABELS.INTENDED_PROPERTY_USE}</Label>,
      content: isEditMode ? (
        <Dropdown
          value={formData.intended_property_use ?? ""}
          onChange={(value) => updateFormData("intended_property_use", value)}
          options={INTENDED_USE_OPTIONS}
          placeholder="Select intended use"
        />
      ) : (
        <Box
          className={`mobile-input bg-background-base ${profileFieldValueClassName(
            formData.intended_property_use
          )}`}
        >
          {formData.intended_property_use
            ? INTENDED_USE_OPTIONS.find((opt) => opt.value === formData.intended_property_use)
                ?.label
            : PROFILE_NOT_SPECIFIED_LABEL}
        </Box>
      ),
    },
    {
      title: <Label>{FIELD_LABELS.RENOVATION_PREFERENCE}</Label>,
      content: isEditMode ? (
        <Dropdown
          value={formData.renovation_preference ?? ""}
          onChange={(value) => updateFormData("renovation_preference", value)}
          options={RENOVATION_PREFERENCE_OPTIONS}
          placeholder="Select renovation preference"
        />
      ) : (
        <Box
          className={`mobile-input bg-background-base ${profileFieldValueClassName(
            formData.renovation_preference
          )}`}
        >
          {formData.renovation_preference
            ? RENOVATION_PREFERENCE_OPTIONS.find(
                (opt) => opt.value === formData.renovation_preference
              )?.label
            : PROFILE_NOT_SPECIFIED_LABEL}
        </Box>
      ),
    },
  ];

  return <AlignedRow breakIntoRows="sm" gap="lg" justify="start" items={firstRowItems} />;
}
