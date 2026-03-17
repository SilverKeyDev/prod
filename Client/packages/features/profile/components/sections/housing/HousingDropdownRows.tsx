import React from "react";

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
  return (
    <AlignedRow
      breakIntoRows="md"
      gap="lg"
      justify="start"
      items={[
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
            <div className="mobile-input bg-background-base">
              {formData.preferred_architectural_style
                ? ARCHITECTURAL_STYLE_OPTIONS.find(
                    (opt) => opt.value === formData.preferred_architectural_style
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
              onChange={(value) => updateFormData("walkability_importance", value)}
              options={WALKABILITY_OPTIONS}
              placeholder="Select..."
            />
          ) : (
            <div className="mobile-input bg-background-base">
              {formData.walkability_importance
                ? WALKABILITY_OPTIONS.find((opt) => opt.value === formData.walkability_importance)
                    ?.label
                : "Not specified"}
            </div>
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
            <div className="mobile-input bg-background-base">
              {formData.intended_property_use
                ? INTENDED_USE_OPTIONS.find((opt) => opt.value === formData.intended_property_use)
                    ?.label
                : "Not specified"}
            </div>
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
            <div className="mobile-input bg-background-base">
              {formData.renovation_preference
                ? RENOVATION_OPTIONS.find((opt) => opt.value === formData.renovation_preference)
                    ?.label
                : "Not specified"}
            </div>
          ),
        },
        {
          title: <Label>{FIELD_LABELS.LISTING_TYPE}</Label>,
          content: isEditMode ? (
            <OptionTagInput
              options={LISTING_TYPE_OPTIONS}
              value={(formData.listing_type as string[]) ?? []}
              onChange={(arr) => updateFormData("listing_type", arr)}
              isEditMode={true}
            />
          ) : (
            <div className="mobile-input bg-background-base">
              {((formData.listing_type as string[]) ?? []).length === 0
                ? "Not specified"
                : ((formData.listing_type as string[]) ?? [])
                    .map((v) => LISTING_TYPE_OPTIONS.find((o) => o.value === v)?.label ?? v)
                    .join(", ")}
            </div>
          ),
        },
        ...(isDesktop
          ? [
              {
                title: (
                  <div className="mb-2 block text-sm font-medium text-transparent">&nbsp;</div>
                ),
                content: <div className="mobile-input bg-background-base opacity-0">&nbsp;</div>,
              },
            ]
          : []),
      ]}
    />
  );
}
