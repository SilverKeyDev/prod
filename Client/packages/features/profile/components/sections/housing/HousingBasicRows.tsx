import React from "react";

import { Box } from "packages/ui/components/primitives";

import AlignedRow from "@/components/layout/AlignedRow";
import { Input } from "@/components/ui";
import Label from "@/features/profile/components/settings/inputs/Label";
import OptionTagInput from "@/features/profile/components/settings/inputs/OptionTagInput.web";
import {
  FIELD_LABELS,
  HOUSING_TYPE_OPTIONS,
  MUST_HAVE_OPTIONS,
  type OnboardingData,
  parseHousingTypes,
  PROFILE_NOT_SPECIFIED_LABEL,
  profileFieldValueClassName,
  serializeHousingTypes,
} from "@/features/profile/utils";

type HousingBasicRowsProps = {
  formData: OnboardingData;
  isEditMode: boolean;
  updateFormData: (field: string | number | symbol, value: unknown) => void;
};

export function HousingBasicRows({ formData, isEditMode, updateFormData }: HousingBasicRowsProps) {
  return (
    <>
      <AlignedRow
        breakIntoRows="md"
        gap="lg"
        justify="start"
        items={[
          {
            title: <Label>{FIELD_LABELS.PREFERRED_BEDROOMS}</Label>,
            content: isEditMode ? (
              <Input
                type="number"
                value={formData.preferred_bedrooms?.toString() ?? ""}
                onChange={(e: React.ChangeEvent<HTMLInputElement>) =>
                  updateFormData("preferred_bedrooms", parseInt(e.target.value) || undefined)
                }
                placeholder="Number of bedrooms"
              />
            ) : (
              <Box
                className={`mobile-input bg-background-base ${profileFieldValueClassName(formData.preferred_bedrooms)}`}
              >
                {formData.preferred_bedrooms ?? PROFILE_NOT_SPECIFIED_LABEL}
              </Box>
            ),
          },
          {
            title: <Label>{FIELD_LABELS.PREFERRED_BATHROOMS}</Label>,
            content: isEditMode ? (
              <Input
                type="number"
                value={formData.preferred_bathrooms?.toString() ?? ""}
                onChange={(e: React.ChangeEvent<HTMLInputElement>) =>
                  updateFormData("preferred_bathrooms", parseInt(e.target.value) || undefined)
                }
                placeholder="Number of bathrooms"
              />
            ) : (
              <Box
                className={`mobile-input bg-background-base ${profileFieldValueClassName(formData.preferred_bathrooms)}`}
              >
                {formData.preferred_bathrooms ?? PROFILE_NOT_SPECIFIED_LABEL}
              </Box>
            ),
          },
        ]}
      />

      <AlignedRow
        breakIntoRows="md"
        gap="lg"
        justify="start"
        items={[
          {
            title: <Label>{FIELD_LABELS.PREFERRED_HOUSING_TYPE}</Label>,
            content: (
              <OptionTagInput
                options={HOUSING_TYPE_OPTIONS}
                value={parseHousingTypes(formData.preferred_housing_type)}
                onChange={(arr) =>
                  updateFormData("preferred_housing_type", serializeHousingTypes(arr))
                }
                isEditMode={isEditMode}
              />
            ),
          },
          {
            title: <Label>{FIELD_LABELS.MUST_HAVE}</Label>,
            content: (
              <OptionTagInput
                options={MUST_HAVE_OPTIONS}
                value={(formData.must_have as string[]) ?? []}
                onChange={(arr) => updateFormData("must_have", arr)}
                isEditMode={isEditMode}
              />
            ),
          },
        ]}
      />
    </>
  );
}
