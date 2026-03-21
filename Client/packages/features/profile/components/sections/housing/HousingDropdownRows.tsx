import React from "react";

import { Box } from "packages/ui/components/primitives";

import AlignedRow from "@/components/layout/AlignedRow";
import { Dropdown } from "@/components/ui";
import Label from "@/features/profile/components/settings/inputs/Label";
import OptionTagInput from "@/features/profile/components/settings/inputs/OptionTagInput.web";
import {
  ARCHITECTURAL_STYLE_OPTIONS,
  FIELD_LABELS,
  INTENDED_USE_OPTIONS,
  LISTING_TYPE_OPTIONS,
  type OnboardingData,
  PROFILE_NOT_SPECIFIED_LABEL,
  profileFieldValueClassName,
  RENOVATION_OPTIONS,
} from "@/features/profile/utils";
import { WALKABILITY_OPTIONS } from "@/features/profile/utils/constants";
type HousingDropdownRowsProps = {
  formData: OnboardingData;
  isEditMode: boolean;
  updateFormData: (field: string | number | symbol, value: unknown) => void;
  isDesktop: boolean;
};

export function HousingDropdownRows({
  formData,
  isEditMode,
  updateFormData,
  isDesktop,
}: HousingDropdownRowsProps) {
  const firstRowItems = [
    {
      title: <Label>{FIELD_LABELS.PREFERRED_ARCHITECTURAL_STYLE}</Label>,
      content: isEditMode ? (
        <Dropdown
          value={formData.preferred_architectural_style ?? ""}
          onChange={(value) => updateFormData("preferred_architectural_style", value)}
          options={ARCHITECTURAL_STYLE_OPTIONS}
          placeholder="Select..."
        />
      ) : (
        <Box
          className={`mobile-input bg-background-base ${profileFieldValueClassName(formData.preferred_architectural_style)}`}
        >
          {formData.preferred_architectural_style
            ? ARCHITECTURAL_STYLE_OPTIONS.find(
                (opt) => opt.value === formData.preferred_architectural_style
              )?.label
            : PROFILE_NOT_SPECIFIED_LABEL}
        </Box>
      ),
    },
    {
      title: <Label>{FIELD_LABELS.WALKABILITY_IMPORTANCE}</Label>,
      content: isEditMode ? (
        <Dropdown
          value={formData.walkability_importance ?? ""}
          onChange={(value) => updateFormData("walkability_importance", value)}
          options={WALKABILITY_OPTIONS}
          placeholder="Select..."
        />
      ) : (
        <Box
          className={`mobile-input bg-background-base ${profileFieldValueClassName(formData.walkability_importance)}`}
        >
          {formData.walkability_importance
            ? WALKABILITY_OPTIONS.find((opt) => opt.value === formData.walkability_importance)
                ?.label
            : PROFILE_NOT_SPECIFIED_LABEL}
        </Box>
      ),
    },
    {
      title: <Label>{FIELD_LABELS.INTENDED_PROPERTY_USE}</Label>,
      content: isEditMode ? (
        <Dropdown
          value={formData.intended_property_use ?? ""}
          onChange={(value) => updateFormData("intended_property_use", value)}
          options={INTENDED_USE_OPTIONS}
          placeholder="Select..."
        />
      ) : (
        <Box
          className={`mobile-input bg-background-base ${profileFieldValueClassName(formData.intended_property_use)}`}
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
          options={RENOVATION_OPTIONS}
          placeholder="Select..."
        />
      ) : (
        <Box
          className={`mobile-input bg-background-base ${profileFieldValueClassName(formData.renovation_preference)}`}
        >
          {formData.renovation_preference
            ? RENOVATION_OPTIONS.find((opt) => opt.value === formData.renovation_preference)?.label
            : PROFILE_NOT_SPECIFIED_LABEL}
        </Box>
      ),
    },
    ...(isDesktop
      ? [
          {
            title: <Box className="mb-2 block text-sm font-medium text-transparent">&nbsp;</Box>,
            content: <Box className="mobile-input bg-background-base opacity-0">&nbsp;</Box>,
          },
        ]
      : []),
  ];

  const listingTypeItem = {
    title: <Label>{FIELD_LABELS.LISTING_TYPE}</Label>,
    content: (
      <OptionTagInput
        options={LISTING_TYPE_OPTIONS}
        value={(formData.listing_type as string[]) ?? []}
        onChange={(arr) => updateFormData("listing_type", arr)}
        isEditMode={isEditMode}
      />
    ),
  };

  return (
    <>
      <AlignedRow breakIntoRows="md" gap="lg" justify="start" items={firstRowItems} />
      <AlignedRow breakIntoRows="md" gap="lg" justify="start" items={[listingTypeItem]} />
    </>
  );
}
