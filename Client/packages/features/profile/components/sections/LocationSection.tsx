import React from "react";

import { BodyText, Subtitle, Title } from "packages/ui/components/index.web";

// Components
import Card from "@/components/layout/Card.web";
import ImportantLocationsInput from "@/features/profile/components/settings/inputs/ImportantLocationsInput.web";
// Constants
import { type OnboardingData, SECTION_TITLES } from "@/features/profile/utils";

type LocationSectionProps = {
  formData: OnboardingData;
  isEditMode: boolean;
  updateFormData: (field: string | number | symbol, value: unknown) => void;
  scriptsReady: boolean;
  loadError?: string | null;
  /** Optional class for the Card wrapper (e.g. transparent + dotted for search header) */
  cardClassName?: string;
  /** When false, render content in a div instead of Card (e.g. when embedded in onboarding page Card). Default true. */
  wrapInCard?: boolean;
};

export default function LocationSection({
  formData,
  isEditMode,
  updateFormData,
  scriptsReady,
  loadError,
  cardClassName,
  wrapInCard = true,
}: LocationSectionProps) {
  const content = (
    <>
      <Title size="md">{SECTION_TITLES.LOCATION_PREFERENCES}</Title>

      {/* Important Locations for Commute */}
      <div className="flex w-full flex-col">
        <Subtitle size="xs" muted className="mb-4">
          Locations set an exact search range; give work, family, or frequently visited places.
        </Subtitle>
        <ImportantLocationsInput
          locations={
            Array.isArray(formData.important_locations) ? formData.important_locations : []
          }
          onChange={(locations) => updateFormData("important_locations", locations)}
          scriptsReady={scriptsReady}
          isEditMode={isEditMode}
        />
        {loadError && (
          <BodyText as="p" size="xs" className="mt-2 text-red-500">
            {loadError}
          </BodyText>
        )}
      </div>
    </>
  );
  const className = cardClassName ? `${cardClassName} space-y-2` : "space-y-2";
  return wrapInCard ? (
    <Card className={className}>{content}</Card>
  ) : (
    <div className={className}>{content}</div>
  );
}
