import { Box } from "packages/ui/components/primitives";

import AlignedRow from "@/components/layout/AlignedRow";
import BudgetRangeSlider from "@/features/profile/components/settings/inputs/BudgetRangeSlider";
import Label from "@/features/profile/components/settings/inputs/Label";
import OptionTagInput from "@/features/profile/components/settings/inputs/OptionTagInput.web";
import {
  BATHROOMS_TICK_VALUES,
  BEDROOMS_TICK_VALUES,
  FIELD_LABELS,
  HOUSING_TYPE_OPTIONS,
  LISTING_TYPE_OPTIONS,
  MUST_HAVE_OPTIONS,
  type OnboardingData,
  parseHousingTypes,
  PROFILE_NOT_SPECIFIED_LABEL,
  profileRangeValueClassName,
  serializeHousingTypes,
} from "@/features/profile/utils";

type HousingEssentialRowsProps = {
  formData: OnboardingData;
  isEditMode: boolean;
  updateFormData: (field: keyof OnboardingData, value: unknown) => void;
};

export function HousingEssentialRows({
  formData,
  isEditMode,
  updateFormData,
}: HousingEssentialRowsProps) {
  return (
    <>
      <AlignedRow
        breakIntoRows="sm"
        gap="lg"
        justify="start"
        items={[
          {
            title: <Label>{FIELD_LABELS.PREFERRED_BEDROOMS}</Label>,
            content: isEditMode ? (
              <BudgetRangeSlider
                tickValues={BEDROOMS_TICK_VALUES}
                minValue={
                  formData.preferred_bedrooms_min ?? BEDROOMS_TICK_VALUES[0]
                }
                maxValue={
                  formData.preferred_bedrooms_max ??
                  BEDROOMS_TICK_VALUES[BEDROOMS_TICK_VALUES.length - 1]
                }
                onChange={(minVal, maxVal) => {
                  updateFormData("preferred_bedrooms_min", minVal);
                  updateFormData("preferred_bedrooms_max", maxVal);
                }}
                formatValue={(v) => `${v} bed${v !== 1 ? "s" : ""}`}
                formatPrefix=""
                minGap={1}
              />
            ) : (
              <Box
                className={`mobile-input bg-background-base ${profileRangeValueClassName(
                  formData.preferred_bedrooms_min,
                  formData.preferred_bedrooms_max,
                )}`}
              >
                {formData.preferred_bedrooms_min != null ||
                formData.preferred_bedrooms_max != null
                  ? `${
                      formData.preferred_bedrooms_min ?? BEDROOMS_TICK_VALUES[0]
                    } – ${
                      formData.preferred_bedrooms_max ===
                      BEDROOMS_TICK_VALUES[BEDROOMS_TICK_VALUES.length - 1]
                        ? "8+"
                        : formData.preferred_bedrooms_max ??
                          BEDROOMS_TICK_VALUES[BEDROOMS_TICK_VALUES.length - 1]
                    } beds`
                  : PROFILE_NOT_SPECIFIED_LABEL}
              </Box>
            ),
          },
          {
            title: <Label>{FIELD_LABELS.PREFERRED_BATHROOMS}</Label>,
            content: isEditMode ? (
              <BudgetRangeSlider
                tickValues={BATHROOMS_TICK_VALUES}
                minValue={
                  formData.preferred_bathrooms_min ?? BATHROOMS_TICK_VALUES[0]
                }
                maxValue={
                  formData.preferred_bathrooms_max ??
                  BATHROOMS_TICK_VALUES[BATHROOMS_TICK_VALUES.length - 1]
                }
                onChange={(minVal, maxVal) => {
                  updateFormData("preferred_bathrooms_min", minVal);
                  updateFormData("preferred_bathrooms_max", maxVal);
                }}
                formatValue={(v) => `${v} bath${v !== 1 ? "s" : ""}`}
                formatPrefix=""
                minGap={1}
              />
            ) : (
              <Box
                className={`mobile-input bg-background-base ${profileRangeValueClassName(
                  formData.preferred_bathrooms_min,
                  formData.preferred_bathrooms_max,
                )}`}
              >
                {formData.preferred_bathrooms_min != null ||
                formData.preferred_bathrooms_max != null
                  ? `${
                      formData.preferred_bathrooms_min ??
                      BATHROOMS_TICK_VALUES[0]
                    } – ${
                      formData.preferred_bathrooms_max ===
                      BATHROOMS_TICK_VALUES[BATHROOMS_TICK_VALUES.length - 1]
                        ? "8+"
                        : formData.preferred_bathrooms_max ??
                          BATHROOMS_TICK_VALUES[
                            BATHROOMS_TICK_VALUES.length - 1
                          ]
                    } baths`
                  : PROFILE_NOT_SPECIFIED_LABEL}
              </Box>
            ),
          },
        ]}
      />

      <AlignedRow
        breakIntoRows="sm"
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
                  updateFormData(
                    "preferred_housing_type",
                    serializeHousingTypes(arr),
                  )
                }
                isEditMode={isEditMode}
              />
            ),
          },
          {
            title: <Label>{FIELD_LABELS.LISTING_TYPE}</Label>,
            content: (
              <OptionTagInput
                options={LISTING_TYPE_OPTIONS}
                value={(formData.listing_type as string[]) ?? []}
                onChange={(arr) => updateFormData("listing_type", arr)}
                isEditMode={isEditMode}
              />
            ),
          },
        ]}
      />

      <AlignedRow
        breakIntoRows="sm"
        gap="lg"
        justify="start"
        items={[
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
