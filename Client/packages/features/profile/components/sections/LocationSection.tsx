import React, { useCallback } from "react";

import {
  ProfileSectionBody,
  ProfileSectionCallout,
  useShowPersonalizationSectionBodyTitle,
} from "packages/features/profile/components/layout";
import { useAgentOptionalBuyerCalloutVisibility } from "packages/features/profile/hooks/useAgentOptionalBuyerCalloutVisibility";
import type { BuyerPreferenceExtensions } from "packages/features/profile/types/sections/buyerPreferenceExtensions";
import { Box } from "packages/ui/components/structure/primitives";

import { BodyText, Subtitle, Title } from "@/components/ui";
import { SearchPrefsLocation } from "@/features/profile/components/profileScreen/searchPreferences/SearchPrefsLocation";
import { SearchPrefsNeighborhood } from "@/features/profile/components/profileScreen/searchPreferences/SearchPrefsNeighborhood";
import type { PatchBuyerPreferenceExtensions } from "@/features/profile/components/profileScreen/searchPreferences/types";
import { withBuyerExtV1 } from "@/features/profile/components/profileScreen/searchPreferences/withBuyerExtV1";
import ImportantLocationsInput from "@/features/profile/components/settings/inputs/locations/ImportantLocationsInput.web";
import {
  AGENT_OPTIONAL_BUYER_LOCATION_PREFERENCES_HINT,
  LOCATION_SUBTITLE,
  type OnboardingData,
  SECTION_TITLES,
} from "@/features/profile/utils";

type LocationSectionProps = {
  formData: OnboardingData;
  isEditMode: boolean;
  updateFormData: (field: keyof OnboardingData, value: unknown) => void;
  scriptsReady: boolean;
  loadError?: string | null;
  patchBuyerPreferenceExtensions: PatchBuyerPreferenceExtensions;
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
  patchBuyerPreferenceExtensions,
  addButtonLabel,
  titleId,
}: LocationSectionProps) {
  const showSectionTitle = useShowPersonalizationSectionBodyTitle();
  const showAgentOptionalBuyerCallout = useAgentOptionalBuyerCalloutVisibility(formData);

  const patch = useCallback(
    (fn: (prev: BuyerPreferenceExtensions | undefined) => BuyerPreferenceExtensions) => {
      patchBuyerPreferenceExtensions(fn);
    },
    [patchBuyerPreferenceExtensions]
  );

  const ext = withBuyerExtV1(formData.buyerPreferenceExtensions);

  return (
    <>
      {showSectionTitle && (
        <Title size="md" as="h2" id={titleId}>
          {SECTION_TITLES.LOCATION_PREFERENCES}
        </Title>
      )}
      {showAgentOptionalBuyerCallout && (
        <ProfileSectionCallout>
          {AGENT_OPTIONAL_BUYER_LOCATION_PREFERENCES_HINT}
        </ProfileSectionCallout>
      )}

      <ProfileSectionBody>
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

        <Box className="flex flex-col gap-6">
          <SearchPrefsLocation
            isEditMode={isEditMode}
            patch={patch}
            loc={ext.location_prefs ?? {}}
          />
          <SearchPrefsNeighborhood
            isEditMode={isEditMode}
            patch={patch}
            neigh={ext.neighborhood ?? {}}
          />
        </Box>
      </ProfileSectionBody>
    </>
  );
}
