import React from "react";

import {
  FIELD_LABELS,
  INTENDED_USE_OPTIONS,
  type OnboardingData,
  RENOVATION_OPTIONS,
} from "packages/utils/domain/profile";
import { WALKABILITY_OPTIONS } from "packages/utils/domain/profile/constants";

import AlignedRow from "@/components/layout/AlignedRow";
import { Dropdown } from "@/components/ui/index.web";
import Label from "@/features/profile/components/Label.web";

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
  return (
    <AlignedRow
      breakIntoRows="md"
      gap="lg"
      justify="start"
      items={[
        {
          title: <Label>{FIELD_LABELS.RENOVATION_PREFERENCE}</Label>,
          content: isEditMode ? (
            <Dropdown
              value={formData.renovation_preference ?? ""}
              onChange={(value) =>
                updateFormData("renovation_preference", value)
              }
              options={RENOVATION_OPTIONS}
              placeholder="Select..."
            />
          ) : (
            <div className="mobile-input bg-gray-50">
              {formData.renovation_preference
                ? RENOVATION_OPTIONS.find(
                    (opt) => opt.value === formData.renovation_preference,
                  )?.label
                : "Not specified"}
            </div>
          ),
        },
        {
          title: <Label>{FIELD_LABELS.INTENDED_PROPERTY_USE}</Label>,
          content: isEditMode ? (
            <Dropdown
              value={formData.intended_property_use ?? ""}
              onChange={(value) =>
                updateFormData("intended_property_use", value)
              }
              options={INTENDED_USE_OPTIONS}
              placeholder="Select..."
            />
          ) : (
            <div className="mobile-input bg-gray-50">
              {formData.intended_property_use
                ? INTENDED_USE_OPTIONS.find(
                    (opt) => opt.value === formData.intended_property_use,
                  )?.label
                : "Not specified"}
            </div>
          ),
        },
        {
          title: <Label>{FIELD_LABELS.WALKABILITY_IMPORTANCE}</Label>,
          content: isEditMode ? (
            <Dropdown
              value={formData.walkability_importance ?? ""}
              onChange={(value) =>
                updateFormData("walkability_importance", value)
              }
              options={WALKABILITY_OPTIONS}
              placeholder="Select..."
            />
          ) : (
            <div className="mobile-input bg-gray-50">
              {formData.walkability_importance
                ? WALKABILITY_OPTIONS.find(
                    (opt) => opt.value === formData.walkability_importance,
                  )?.label
                : "Not specified"}
            </div>
          ),
        },
        ...(isDesktop
          ? [
              {
                title: (
                  <div className="mb-2 block text-sm font-medium text-transparent">
                    &nbsp;
                  </div>
                ),
                content: (
                  <div className="mobile-input bg-gray-50 opacity-0">
                    &nbsp;
                  </div>
                ),
              },
            ]
          : []),
      ]}
    />
  );
}
