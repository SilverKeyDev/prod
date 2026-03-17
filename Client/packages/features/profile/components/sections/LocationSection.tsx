import React from "react";

import { Box } from "packages/ui/components/primitives";

// Components
import Card from "@/components/layout/Card.web";
import { BodyText, Subtitle, Title } from "@/components/ui";
import ImportantLocationsInput from "@/features/profile/components/settings/inputs/ImportantLocationsInput.web";
// Constants
import { LOCATION_SUBTITLE, type OnboardingData, SECTION_TITLES } from "@/features/profile/utils";
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
  /** Optional label for the add location button */
  addButtonLabel?: string;
  /** Optional id for the section title (e.g. for aria-labelledby on dialog) */
  titleId?: string;
};

export default function LocationSection({
  formData,
  isEditMode,
  updateFormData,
  scriptsReady,
  loadError,
  cardClassName,
  wrapInCard = true,
  addButtonLabel,
  titleId,
}: LocationSectionProps) {
  const content = (
    <>
      <Title size="md" as="h2" id={titleId}>
        {SECTION_TITLES.LOCATION_PREFERENCES}
      </Title>

      {/* Important Locations for Commute */}
      <Box className="flex w-full flex-col">
        <Subtitle size="xs" muted className="mb-4">
          {LOCATION_SUBTITLE}
        </Subtitle>
        <ImportantLocationsInput
          locations={
            Array.isArray(formData.important_locations) ? formData.important_locations : []
          }
          onChange={(locations) => updateFormData("important_locations", locations)}
          scriptsReady={scriptsReady}
          isEditMode={isEditMode}
          addButtonLabel={addButtonLabel}
        />
        {loadError && (
          <BodyText as="p" size="xs" className="mt-2 text-red-500">
            {loadError}
          </BodyText>
        )}
      </Box>
    </>
  );
  const className = cardClassName ? `${cardClassName} space-y-2` : "space-y-2";
  return wrapInCard ? (
    <Card border="charcoal" className={className}>{content}</Card>
  ) : (
    <Box className={className}>{content}</Box>
  );
}
