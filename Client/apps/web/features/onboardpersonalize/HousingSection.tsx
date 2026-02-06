import React from "react";

// Components
import AlignedRow from "../../components/layout/AlignedRow";
import Card from "../../components/layout/Card";
import { Dropdown, Input, Title } from "../../components/ui";
import Label from "./Label";
import OnPerTagInput from "./TagInput";

// Constants
import {
  SECTION_TITLES,
  FIELD_LABELS,
  HOUSING_TYPE_OPTIONS,
  type OnboardingData,
} from "./lib/constants";

export type ImportantLocation = NonNullable<
  OnboardingData["important_locations"]
>[number];

export function getPreservedImportantLocations(
  previous: ImportantLocation[] | undefined | null,
  next: ImportantLocation[] | undefined | null,
): ImportantLocation[] | undefined {
  const prevLocations = Array.isArray(previous) ? previous : [];
  const nextLocations = Array.isArray(next) ? next : [];

  if (prevLocations.length === 0) {
    return nextLocations;
  }

  // If the user tried to delete all locations without adding a new one,
  // preserve the last location they attempted to delete instead of saving none.
  if (nextLocations.length === 0) {
    const removedLocation =
      [...prevLocations]
        .reverse()
        .find(
          (prevLocation) =>
            !nextLocations.some(
              (nextLocation) =>
                nextLocation &&
                prevLocation &&
                nextLocation.name === prevLocation.name &&
                nextLocation.address === prevLocation.address &&
                nextLocation.commute_tolerance ===
                  prevLocation.commute_tolerance,
            ),
        ) ?? prevLocations[prevLocations.length - 1];

    return removedLocation ? [removedLocation] : nextLocations;
  }

  return nextLocations;
}

type HousingSectionProps = {
  formData: OnboardingData;
  isEditMode: boolean;
  updateFormData: (field: string | number | symbol, value: unknown) => void;
  isDesktop: boolean;
};

export default function HousingSection({
  formData,
  isEditMode,
  updateFormData,
  isDesktop,
}: HousingSectionProps) {
  return (
    <Card className="space-y-6">
      <Title size="md" className="mb-2">
        {SECTION_TITLES.HOUSING_PREFERENCES}
      </Title>

      <AlignedRow
        breakIntoRows="md"
        gap="lg"
        justify="start"
        items={[
          {
            title: <Label>{FIELD_LABELS.PREFERRED_HOUSING_TYPE}</Label>,
            content: isEditMode ? (
              <Dropdown
                value={formData.preferred_housing_type ?? ""}
                onChange={(value) =>
                  updateFormData("preferred_housing_type", value)
                }
                options={HOUSING_TYPE_OPTIONS}
                placeholder="Select..."
              />
            ) : (
              <div className="mobile-input bg-gray-50">
                {formData.preferred_housing_type
                  ? (HOUSING_TYPE_OPTIONS.find(
                      (option) =>
                        option.value === formData.preferred_housing_type
                    )?.label ?? "Not specified")
                  : "Not specified"}
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
                    parseInt(e.target.value) || undefined
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
            title: <Label>{FIELD_LABELS.PREFERRED_BATHROOMS}</Label>,
            content: isEditMode ? (
              <Input
                type="number"
                value={formData.preferred_bathrooms?.toString() ?? ""}
                onChange={(e: React.ChangeEvent<HTMLInputElement>) =>
                  updateFormData(
                    "preferred_bathrooms",
                    parseInt(e.target.value) || undefined
                  )
                }
                placeholder="Number of bathrooms"
              />
            ) : (
              <div className="mobile-input bg-gray-50">
                {formData.preferred_bathrooms ?? "Not specified"}
              </div>
            ),
          },
          {
            title: <Label>{FIELD_LABELS.PREFERRED_LOT_SIZE}</Label>,
            content: isEditMode ? (
              <Dropdown
                value={formData.preferred_lot_size ?? ""}
                onChange={(value) =>
                  updateFormData("preferred_lot_size", value)
                }
                options={[
                  { value: "small", label: "Small (under 0.25 acres)" },
                  { value: "medium", label: "Medium (0.25 - 0.5 acres)" },
                  { value: "large", label: "Large (0.5 - 1 acre)" },
                  { value: "very_large", label: "Very Large (1+ acres)" },
                ]}
                placeholder="Select..."
              />
            ) : (
              <div className="mobile-input bg-gray-50">
                {formData.preferred_lot_size
                  ? [
                      {
                        value: "small",
                        label: "Small (under 0.25 acres)",
                      },
                      {
                        value: "medium",
                        label: "Medium (0.25 - 0.5 acres)",
                      },
                      { value: "large", label: "Large (0.5 - 1 acre)" },
                      {
                        value: "very_large",
                        label: "Very Large (1+ acres)",
                      },
                    ].find((opt) => opt.value === formData.preferred_lot_size)
                      ?.label
                  : "Not specified"}
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
            title: <Label>{FIELD_LABELS.PREFERRED_HOME_AGE}</Label>,
            content: isEditMode ? (
              <Dropdown
                value={formData.preferred_home_age ?? ""}
                onChange={(value) =>
                  updateFormData("preferred_home_age", value)
                }
                options={[
                  { value: "new", label: "New (0-5 years)" },
                  { value: "recent", label: "Recent (5-15 years)" },
                  {
                    value: "established",
                    label: "Established (15-30 years)",
                  },
                  { value: "mature", label: "Mature (30-50 years)" },
                  { value: "historic", label: "Historic (50+ years)" },
                ]}
                placeholder="Select..."
              />
            ) : (
              <div className="mobile-input bg-gray-50">
                {formData.preferred_home_age
                  ? [
                      { value: "new", label: "New (0-5 years)" },
                      { value: "recent", label: "Recent (5-15 years)" },
                      {
                        value: "established",
                        label: "Established (15-30 years)",
                      },
                      { value: "mature", label: "Mature (30-50 years)" },
                      {
                        value: "historic",
                        label: "Historic (50+ years)",
                      },
                    ].find((opt) => opt.value === formData.preferred_home_age)
                      ?.label
                  : "Not specified"}
              </div>
            ),
          },
          {
            title: <Label>{FIELD_LABELS.PREFERRED_ARCHITECTURAL_STYLE}</Label>,
            content: isEditMode ? (
              <Dropdown
                value={formData.preferred_architectural_style ?? ""}
                onChange={(value) =>
                  updateFormData("preferred_architectural_style", value)
                }
                options={[
                  { value: "modern", label: "Modern" },
                  { value: "traditional", label: "Traditional" },
                  { value: "colonial", label: "Colonial" },
                  { value: "ranch", label: "Ranch" },
                  { value: "craftsman", label: "Craftsman" },
                  { value: "victorian", label: "Victorian" },
                  { value: "mediterranean", label: "Mediterranean" },
                  { value: "contemporary", label: "Contemporary" },
                ]}
                placeholder="Select..."
              />
            ) : (
              <div className="mobile-input bg-gray-50">
                {formData.preferred_architectural_style
                  ? [
                      { value: "modern", label: "Modern" },
                      { value: "traditional", label: "Traditional" },
                      { value: "colonial", label: "Colonial" },
                      { value: "ranch", label: "Ranch" },
                      { value: "craftsman", label: "Craftsman" },
                      { value: "victorian", label: "Victorian" },
                      { value: "mediterranean", label: "Mediterranean" },
                      { value: "contemporary", label: "Contemporary" },
                    ].find(
                      (opt) =>
                        opt.value === formData.preferred_architectural_style
                    )?.label
                  : "Not specified"}
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
            title: <Label>{FIELD_LABELS.RENOVATION_PREFERENCE}</Label>,
            content: isEditMode ? (
              <Dropdown
                value={formData.renovation_preference ?? ""}
                onChange={(value) =>
                  updateFormData("renovation_preference", value)
                }
                options={[
                  { value: "none", label: "None - Move-in Ready" },
                  { value: "minor", label: "Minor Cosmetic Updates" },
                  { value: "major", label: "Major Renovations" },
                  { value: "complete", label: "Complete Renovation" },
                ]}
                placeholder="Select..."
              />
            ) : (
              <div className="mobile-input bg-gray-50">
                {formData.renovation_preference
                  ? [
                      { value: "none", label: "None - Move-in Ready" },
                      { value: "minor", label: "Minor Cosmetic Updates" },
                      { value: "major", label: "Major Renovations" },
                      { value: "complete", label: "Complete Renovation" },
                    ].find(
                      (opt) => opt.value === formData.renovation_preference
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
                options={[
                  { value: "primary", label: "Primary Residence" },
                  { value: "investment", label: "Investment Property" },
                  { value: "vacation", label: "Vacation Home" },
                  { value: "rental", label: "Rental Property" },
                ]}
                placeholder="Select..."
              />
            ) : (
              <div className="mobile-input bg-gray-50">
                {formData.intended_property_use
                  ? [
                      { value: "primary", label: "Primary Residence" },
                      {
                        value: "investment",
                        label: "Investment Property",
                      },
                      { value: "vacation", label: "Vacation Home" },
                      { value: "rental", label: "Rental Property" },
                    ].find(
                      (opt) => opt.value === formData.intended_property_use
                    )?.label
                  : "Not specified"}
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
            title: <Label>{FIELD_LABELS.WALKABILITY_IMPORTANCE}</Label>,
            content: isEditMode ? (
              <Dropdown
                value={formData.walkability_importance ?? ""}
                onChange={(value) =>
                  updateFormData("walkability_importance", value)
                }
                options={[
                  { value: "very_important", label: "Very Important" },
                  {
                    value: "somewhat_important",
                    label: "Somewhat Important",
                  },
                  { value: "not_important", label: "Not Important" },
                ]}
                placeholder="Select..."
              />
            ) : (
              <div className="mobile-input bg-gray-50">
                {formData.walkability_importance
                  ? [
                      {
                        value: "very_important",
                        label: "Very Important",
                      },
                      {
                        value: "somewhat_important",
                        label: "Somewhat Important",
                      },
                      { value: "not_important", label: "Not Important" },
                    ].find(
                      (opt) => opt.value === formData.walkability_importance
                    )?.label
                  : "Not specified"}
              </div>
            ),
          },
          // Only include spacer on desktop (above md breakpoint) to avoid gap in single column
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

      <div className="space-y-6">
        <div>
          <Label>{FIELD_LABELS.PREFERRED_HOME_FEATURES}</Label>
          <OnPerTagInput
            value={(formData.preferred_home_features as string[]) ?? []}
            onChange={(value: string[]) =>
              updateFormData("preferred_home_features", value)
            }
            placeholder="e.g., garage, pool, fireplace"
            isEditMode={isEditMode}
          />
        </div>

        <div>
          <Label>{FIELD_LABELS.DEAL_BREAKERS}</Label>
          <OnPerTagInput
            value={(formData.deal_breakers as string[]) ?? []}
            onChange={(value: string[]) =>
              updateFormData("deal_breakers", value)
            }
            placeholder="e.g., No parking, Busy road, Old plumbing"
            isEditMode={isEditMode}
          />
        </div>
      </div>
    </Card>
  );
}
