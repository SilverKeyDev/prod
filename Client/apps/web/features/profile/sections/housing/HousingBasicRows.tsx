import React from "react";

import {
  FIELD_LABELS,
  HOUSING_TYPE_OPTIONS,
  LISTING_TYPE_OPTIONS,
  MUST_HAVE_OPTIONS,
  type OnboardingData,
  parseHousingTypes,
  serializeHousingTypes,
} from "packages/utils/domain/profile";

import AlignedRow from "@/components/layout/AlignedRow";
import { Input } from "@/components/ui/index.web";
import Label from "@/features/profile/components/Label.web";
import OptionTagInput from "@/features/profile/components/OptionTagInput.web";

type HousingBasicRowsProps = {
  formData: OnboardingData;
  isEditMode: boolean;
  updateFormData: (field: string | number | symbol, value: unknown) => void;
};

export function HousingBasicRows({
  formData,
  isEditMode,
  updateFormData,
}: HousingBasicRowsProps) {
  return (
    <>
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
                  updateFormData(
                    "preferred_housing_type",
                    serializeHousingTypes(arr),
                  )
                }
                isEditMode={true}
              />
            ) : (
              <div className="mobile-input bg-gray-50">
                {(() => {
                  const selected = parseHousingTypes(
                    formData.preferred_housing_type,
                  );
                  if (selected.length === 0) return "Not specified";
                  const labels = selected.map(
                    (v) =>
                      HOUSING_TYPE_OPTIONS.find((o) => o.value === v)?.label ??
                      v,
                  );
                  return labels.join(", ");
                })()}
              </div>
            ),
          },
          {
            title: <Label>{FIELD_LABELS.PREFERRED_BEDROOMS}</Label>,
            content: isEditMode ? (
              <Input
                type="number"
                value={formData.preferred_bedrooms?.toString() ?? ""}
                onChange={(e: React.ChangeEvent<HTMLInputElement>) =>
                  updateFormData(
                    "preferred_bedrooms",
                    parseInt(e.target.value) || undefined,
                  )
                }
                placeholder="Number of bedrooms"
              />
            ) : (
              <div className="mobile-input bg-gray-50">
                {formData.preferred_bedrooms ?? "Not specified"}
              </div>
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
            title: <Label>{FIELD_LABELS.MUST_HAVE}</Label>,
            content: isEditMode ? (
              <OptionTagInput
                options={MUST_HAVE_OPTIONS}
                value={(formData.must_have as string[]) ?? []}
                onChange={(arr) => updateFormData("must_have", arr)}
                isEditMode={true}
              />
            ) : (
              <div className="mobile-input bg-gray-50">
                {((formData.must_have as string[]) ?? []).length === 0
                  ? "Not specified"
                  : ((formData.must_have as string[]) ?? [])
                      .map(
                        (v) =>
                          MUST_HAVE_OPTIONS.find((o) => o.value === v)?.label ??
                          v,
                      )
                      .join(", ")}
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
              <div className="mobile-input bg-gray-50">
                {((formData.listing_type as string[]) ?? []).length === 0
                  ? "Not specified"
                  : ((formData.listing_type as string[]) ?? [])
                      .map(
                        (v) =>
                          LISTING_TYPE_OPTIONS.find((o) => o.value === v)
                            ?.label ?? v,
                      )
                      .join(", ")}
              </div>
            ),
          },
        ]}
      />
    </>
  );
}
