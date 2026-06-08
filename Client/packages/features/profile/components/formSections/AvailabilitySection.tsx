import { useCallback } from "react";

/* Import shell directly — calendar feature barrel pulls agenda/modals that depend on profile (cycle). */
import { LocalAvailabilityCalendar } from "packages/features/calendar/components/shell/LocalAvailabilityCalendar";
import {
  ProfileSectionBody,
  useShowPersonalizationSectionBodyTitle,
} from "packages/features/profile/components/layout";
import type { PatchBuyerPreferenceExtensions } from "packages/features/profile/components/profileScreen/searchPreferences/types";
import { withBuyerExtV1 } from "packages/features/profile/components/profileScreen/searchPreferences/withBuyerExtV1";
import type { BuyerPreferenceExtensions } from "packages/features/profile/types/sections/buyerPreferenceExtensions";
import {
  AVAILABILITY_SUBTITLE,
  type OnboardingData,
  SECTION_TITLES,
} from "packages/features/profile/utils";
import { Box } from "packages/ui/components/structure/primitives";

import { BodyText, Subtitle, Title } from "@/components/ui";

type AvailabilitySectionProps = {
  formData: OnboardingData;
  isEditMode: boolean;
  patchBuyerPreferenceExtensions: PatchBuyerPreferenceExtensions;
  titleId?: string;
};

export default function AvailabilitySection({
  formData,
  isEditMode,
  patchBuyerPreferenceExtensions,
  titleId,
}: AvailabilitySectionProps) {
  const showSectionTitle = useShowPersonalizationSectionBodyTitle();

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
          {SECTION_TITLES.AVAILABILITY}
        </Title>
      )}
      <ProfileSectionBody>
        <Box className="flex w-full flex-col gap-4">
          <Subtitle size="xs" muted className="mb-0">
            {AVAILABILITY_SUBTITLE}
          </Subtitle>
          {!isEditMode ? (
            <BodyText size="xs" muted as="p" className="mb-0">
              Select Edit to update when clients see you as available for bookings.
            </BodyText>
          ) : null}
          <LocalAvailabilityCalendar
            buyerPreferenceExtensions={ext}
            patchBuyerPreferenceExtensions={patch}
            isInteractionEnabled={isEditMode}
            showSelectedDayEventList
          />
        </Box>
      </ProfileSectionBody>
    </>
  );
}
