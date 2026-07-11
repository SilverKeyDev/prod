/**
 * RenterMoveTimelineStep — SIL-226
 * Captures move-in timeline for renter onboarding.
 */
import React from "react";

import type { OnboardingData } from "packages/features/profile/types/onboarding/onboarding";
import { RENTER_TRANSLATIONS } from "packages/features/renter/types/translations";
import { Button } from "packages/ui";
import { Box } from "packages/ui/components/structure/primitives";
import BodyText from "packages/ui/components/structure/text/BodyText";
import Title from "packages/ui/components/structure/text/Title";

type Props = {
  formData: OnboardingData;
  updateFormData: (field: keyof OnboardingData, value: unknown) => void;
};

const TIMELINE_OPTIONS = [
  { value: "immediately", label: RENTER_TRANSLATIONS.RENTER_MOVE_TIMELINE_IMMEDIATELY },
  { value: "1_month", label: RENTER_TRANSLATIONS.RENTER_MOVE_TIMELINE_ONE_MONTH },
  { value: "3_months", label: RENTER_TRANSLATIONS.RENTER_MOVE_TIMELINE_THREE_MONTHS },
  { value: "6_months", label: RENTER_TRANSLATIONS.RENTER_MOVE_TIMELINE_SIX_MONTHS },
  { value: "flexible", label: RENTER_TRANSLATIONS.RENTER_MOVE_TIMELINE_FLEXIBLE },
];

export function RenterMoveTimelineStep({ formData, updateFormData }: Props) {
  return (
    <Box className="flex flex-col gap-6">
      <Box>
        <Title size="md" as="h2">
          {RENTER_TRANSLATIONS.RENTER_MOVE_TIMELINE_TITLE}
        </Title>
        <BodyText size="sm" muted className="mt-1">
          {RENTER_TRANSLATIONS.RENTER_MOVE_TIMELINE_SUBTITLE}
        </BodyText>
      </Box>
      <Box className="flex flex-col gap-2">
        {TIMELINE_OPTIONS.map((opt) => (
          <Button
            key={opt.value}
            type="button"
            variant="outline"
            size="sm"
            contentAlign="start"
            label={opt.label}
            onClick={() => updateFormData("renter_move_in_timeline", opt.value)}
            className={`rounded-xl border px-4 py-3 text-left text-sm font-medium transition-colors ${
              formData.renter_move_in_timeline === opt.value
                ? "border-blue-500 bg-blue-50 text-blue-700"
                : "border-gray-200 bg-white text-gray-700 hover:bg-gray-50"
            }`}
          >
            <Button.Label
              variant="outline"
              size="sm"
              className={
                formData.renter_move_in_timeline === opt.value ? "text-blue-700" : "text-gray-700"
              }
            >
              {opt.label}
            </Button.Label>
          </Button>
        ))}
      </Box>
    </Box>
  );
}
