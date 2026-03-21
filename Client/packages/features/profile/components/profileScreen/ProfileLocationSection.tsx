import React from "react";

import { ImportantLocationsInput } from "packages/features/profile/components/settings/inputs/ImportantLocationsInput";
import {
  AGENT_OPTIONAL_BUYER_LOCATION_PREFERENCES_HINT,
  effectiveIsAgentForOptionalBuyerUi,
  FIELD_LABELS,
  LOCATION_SUBTITLE,
  type OnboardingData,
  SECTION_TITLES,
} from "packages/features/profile/utils";
import { useIsAgent } from "packages/hooks/store/useIsAgent";
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
  const authIsAgent = useIsAgent();
  const showAgentOptionalBuyerCallout = effectiveIsAgentForOptionalBuyerUi({
    authIsAgent,
    formIsAgent: formData.is_agent,
  });
  const locations = Array.isArray(formData.important_locations) ? formData.important_locations : [];

  return (
    <Box className="gap-4">
      <Title size="md">{SECTION_TITLES.LOCATION_PREFERENCES}</Title>
      {showAgentOptionalBuyerCallout && (
        <Box className="border-border bg-background-surface rounded-lg border px-3 py-2">
          <BodyText size="xs" muted>
            {AGENT_OPTIONAL_BUYER_LOCATION_PREFERENCES_HINT}
          </BodyText>
        </Box>
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
