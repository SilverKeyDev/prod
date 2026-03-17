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
              <Box className="mobile-input bg-background-base">
                {formData.preferred_bedrooms ?? "Not specified"}
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
              <Box className="mobile-input bg-background-base">
                {formData.preferred_bathrooms ?? "Not specified"}
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
            content: isEditMode ? (
              <OptionTagInput
                options={HOUSING_TYPE_OPTIONS}
                value={parseHousingTypes(formData.preferred_housing_type)}
                onChange={(arr) =>
                  updateFormData("preferred_housing_type", serializeHousingTypes(arr))
                }
                isEditMode={true}
              />
            ) : (
              <Box className="mobile-input bg-background-base">
                {(() => {
                  const selected = parseHousingTypes(formData.preferred_housing_type);
                  if (selected.length === 0) return "Not specified";
                  const labels = selected.map(
                    (v) => HOUSING_TYPE_OPTIONS.find((o) => o.value === v)?.label ?? v
                  );
                  return labels.join(", ");
                })()}
              </Box>
            ),
          },
          {
            title: <Label>{FIELD_LABELS.MUST_HAVE}</Label>,
            content: isEditMode ? (
              <OptionTagInput
                options={MUST_HAVE_OPTIONS}
                value={(formData.must_have as string[]) ?? []}
                onChange={(arr) => updateFormData("must_have", arr)}
                isEditMode={true}
              />
            ) : (
              <Box className="mobile-input bg-background-base">
                {((formData.must_have as string[]) ?? []).length === 0
                  ? "Not specified"
                  : ((formData.must_have as string[]) ?? [])
                      .map((v) => MUST_HAVE_OPTIONS.find((o) => o.value === v)?.label ?? v)
                      .join(", ")}
              </Box>
            ),
          },
        ]}
      />
    </>
  );
}
