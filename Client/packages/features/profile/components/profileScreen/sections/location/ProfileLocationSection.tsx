import React, { useCallback } from "react";

import {
  ProfileSectionBody,
  ProfileSectionCallout,
  useShowPersonalizationSectionBodyTitle,
} from "packages/features/profile/components/layout";
import { SearchPrefsLocation } from "packages/features/profile/components/profileScreen/searchPreferences/SearchPrefsLocation";
import { SearchPrefsNeighborhood } from "packages/features/profile/components/profileScreen/searchPreferences/SearchPrefsNeighborhood";
import type { PatchBuyerPreferenceExtensions } from "packages/features/profile/components/profileScreen/searchPreferences/types";
import { withBuyerExtV1 } from "packages/features/profile/components/profileScreen/searchPreferences/withBuyerExtV1";
import { ImportantLocationsInput } from "packages/features/profile/components/settings/inputs/locations/ImportantLocationsInput";
import { useAgentOptionalBuyerCalloutVisibility } from "packages/features/profile/hooks/useAgentOptionalBuyerCalloutVisibility";
import type { BuyerPreferenceExtensions } from "packages/features/profile/types/sections/buyerPreferenceExtensions";
import {
  AGENT_OPTIONAL_BUYER_LOCATION_PREFERENCES_HINT,
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
  patchBuyerPreferenceExtensions: PatchBuyerPreferenceExtensions;
};

export function ProfileLocationSection({
  formData,
  isEditMode,
  updateField,
  patchBuyerPreferenceExtensions,
}: ProfileLocationSectionProps) {
  const showSectionTitle = useShowPersonalizationSectionBodyTitle();
  const showAgentOptionalBuyerCallout = useAgentOptionalBuyerCalloutVisibility(formData);
  const locations = Array.isArray(formData.important_locations) ? formData.important_locations : [];

  const patch = useCallback(
    (fn: (prev: BuyerPreferenceExtensions | undefined) => BuyerPreferenceExtensions) => {
      patchBuyerPreferenceExtensions(fn);
    },
    [patchBuyerPreferenceExtensions]
  );

  const ext = withBuyerExtV1(formData.buyerPreferenceExtensions);

  return (
    <ProfileSectionBody>
      {showSectionTitle && <Title size="md">{SECTION_TITLES.LOCATION_PREFERENCES}</Title>}
      {showAgentOptionalBuyerCallout && (
        <ProfileSectionCallout>
          {AGENT_OPTIONAL_BUYER_LOCATION_PREFERENCES_HINT}
        </ProfileSectionCallout>
      )}

      <Subtitle size="xs" muted className="mb-4">
        {LOCATION_SUBTITLE}
      </Subtitle>

      <Box>
        <BodyText size="sm" className="text-text-secondary mb-2 font-medium">
          {FIELD_LABELS.IMPORTANT_LOCATIONS} (e.g. work)
        </BodyText>
        {Array.isArray(formData.important_locations) &&
        formData.important_locations.length === 0 ? (
          <BodyText size="xs" muted className="mb-2">
            Add work, school, neighborhoods, or frequently visited places to guide commute-friendly
            search results.
          </BodyText>
        ) : null}
        <ImportantLocationsInput
          locations={locations}
          onChange={(next) => updateField("important_locations", next)}
          isEditMode={isEditMode}
        />
      </Box>

      <Box className="space-y-6">
        <SearchPrefsLocation isEditMode={isEditMode} patch={patch} loc={ext.location_prefs ?? {}} />
        <SearchPrefsNeighborhood
          isEditMode={isEditMode}
          patch={patch}
          neigh={ext.neighborhood ?? {}}
        />
      </Box>
    </ProfileSectionBody>
  );
}
