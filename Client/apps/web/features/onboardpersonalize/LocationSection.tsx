import React from "react";

// Components
import Card from "../../components/layout/Card";
import { Subtitle, Title } from "../../components/ui";
import ImportantLocationsInput from "./ImportantLocationsInput";

// Constants
import { SECTION_TITLES, type OnboardingData } from "./lib/constants";

type LocationSectionProps = {
  formData: OnboardingData;
  isEditMode: boolean;
  updateFormData: (field: string | number | symbol, value: unknown) => void;
  scriptsReady: boolean;
  loadError?: string | null;
};

export default function LocationSection({
  formData,
  isEditMode,
  updateFormData,
  scriptsReady,
  loadError,
}: LocationSectionProps) {
  return (
    <Card className="space-y-2">
      <Title size="md">{SECTION_TITLES.LOCATION_PREFERENCES}</Title>

      {/* Important Locations for Commute */}
      <div className="flex w-full flex-col">
        <Subtitle size="xs" muted className="mb-4">
          Locations set an exact search range; give work, family, or frequently
          visited places.
        </Subtitle>
        <ImportantLocationsInput
          locations={
            Array.isArray(formData.important_locations)
              ? formData.important_locations
              : []
          }
          onChange={(locations) =>
            updateFormData("important_locations", locations)
          }
          scriptsReady={scriptsReady}
          isEditMode={isEditMode}
        />
        {loadError && <p className="mt-2 text-xs text-red-500">{loadError}</p>}
      </div>
    </Card>
  );
}
