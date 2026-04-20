import React from "react";

import type { BuyerLocationPrefs } from "packages/features/profile/types/buyerPreferenceExtensions";
import {
  FIELD_LABELS,
  PROFILE_NOT_SPECIFIED_LABEL,
  SECTION_TITLES,
} from "packages/features/profile/utils";
import { WALKABILITY_OPTIONS } from "packages/features/profile/utils/public/constants";
import { Box } from "packages/ui/components/primitives";
import Title from "packages/ui/components/text/Title";

import AlignedRow from "@/components/layout/AlignedRow";
import { Dropdown } from "@/components/ui";
import Label from "@/features/profile/components/settings/inputs/Label";
import { profileFieldValueClassName } from "@/features/profile/utils";

import type { PatchBuyerPreferenceExtensions } from "./types";
import { withBuyerExtV1 } from "./withBuyerExtV1";

type SearchPrefsLocationProps = {
  isEditMode: boolean;
  patch: PatchBuyerPreferenceExtensions;
  loc: BuyerLocationPrefs;
};

export function SearchPrefsLocation({ isEditMode, patch, loc }: SearchPrefsLocationProps) {
  return (
    <Box className="gap-4">
      <Title size="sm" as="h3" className="mb-3 text-base">
        {SECTION_TITLES.SEARCH_PREFS_LOCATION}
      </Title>
      <AlignedRow
        breakIntoRows="sm"
        gap="lg"
        justify="start"
        items={[
          {
            title: <Label>{FIELD_LABELS.FLOOD_IMPORTANCE}</Label>,
            content: isEditMode ? (
              <Dropdown
                value={loc.flood_importance ?? ""}
                onChange={(value) =>
                  patch((p) => {
                    const b = withBuyerExtV1(p);
                    return {
                      ...b,
                      location_prefs: {
                        ...b.location_prefs,
                        flood_importance: value || undefined,
                      },
                    };
                  })
                }
                options={WALKABILITY_OPTIONS}
                placeholder="Select flood risk importance"
              />
            ) : (
              <Box
                className={`mobile-input bg-background-base ${profileFieldValueClassName(
                  loc.flood_importance
                )}`}
              >
                {WALKABILITY_OPTIONS.find((o) => o.value === loc.flood_importance)?.label ??
                  PROFILE_NOT_SPECIFIED_LABEL}
              </Box>
            ),
          },
          {
            title: <Label>{FIELD_LABELS.NOISE_IMPORTANCE}</Label>,
            content: isEditMode ? (
              <Dropdown
                value={loc.noise_importance ?? ""}
                onChange={(value) =>
                  patch((p) => {
                    const b = withBuyerExtV1(p);
                    return {
                      ...b,
                      location_prefs: {
                        ...b.location_prefs,
                        noise_importance: value || undefined,
                      },
                    };
                  })
                }
                options={WALKABILITY_OPTIONS}
                placeholder="Select noise level importance"
              />
            ) : (
              <Box
                className={`mobile-input bg-background-base ${profileFieldValueClassName(
                  loc.noise_importance
                )}`}
              >
                {WALKABILITY_OPTIONS.find((o) => o.value === loc.noise_importance)?.label ??
                  PROFILE_NOT_SPECIFIED_LABEL}
              </Box>
            ),
          },
        ]}
      />
    </Box>
  );
}
