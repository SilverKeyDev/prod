import React from "react";

import { ImportantLocationsInput } from "packages/features/profile/components/settings/inputs/ImportantLocationsInput";
import {
  FIELD_LABELS,
  LOCATION_SUBTITLE,
  type OnboardingData,
  SECTION_TITLES,
} from "packages/features/profile/utils";
import { Box } from "packages/ui/components/primitives";
import BodyText from "packages/ui/components/text/BodyText";
import Subtitle from "packages/ui/components/text/Subtitle";
import Title from "packages/ui/components/text/Title";

type ProfileLocationSectionProps = {
  formData: OnboardingData;
  isEditMode: boolean;
  updateField: (field: keyof OnboardingData, value: unknown) => void;
};

export function ProfileLocationSection({
  formData,
  isEditMode,
  updateField,
}: ProfileLocationSectionProps) {
  const locations = Array.isArray(formData.important_locations) ? formData.important_locations : [];

  return (
    <Box className="gap-4">
      <Title size="md">{SECTION_TITLES.LOCATION_PREFERENCES}</Title>

      <Subtitle size="xs" muted className="mb-4">
        {LOCATION_SUBTITLE}
      </Subtitle>

      <Box>
        <BodyText size="sm" className="mb-2 font-medium text-gray-700">
          {FIELD_LABELS.IMPORTANT_LOCATIONS} (e.g. work)
        </BodyText>
        {Array.isArray(formData.important_locations) &&
        formData.important_locations.length === 0 ? (
          <BodyText size="xs" muted className="mb-2">
            Add work, school, or frequently visited places to guide commute-friendly search results.
          </BodyText>
        ) : null}
        <ImportantLocationsInput
          locations={locations}
          onChange={(next) => updateField("important_locations", next)}
          isEditMode={isEditMode}
        />
      </Box>
    </Box>
  );
}
