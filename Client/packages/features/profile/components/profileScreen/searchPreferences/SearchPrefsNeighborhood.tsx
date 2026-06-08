import React from "react";

import type { BuyerNeighborhoodPrefs } from "packages/features/profile/types/sections/buyerPreferenceExtensions";
import {
  FIELD_LABELS,
  PROFILE_NOT_SPECIFIED_LABEL,
  SECTION_TITLES,
} from "packages/features/profile/utils";
import { profileFieldValueClassName } from "packages/features/profile/utils";
import { WALKABILITY_OPTIONS } from "packages/features/profile/utils/public/constants";
import { FormFieldLabel as Label } from "packages/ui";
import { Box } from "packages/ui/components/structure/primitives";
import Title from "packages/ui/components/structure/text/Title";

import AlignedRow from "@/components/layout/AlignedRow";
import { Dropdown } from "@/components/ui";

import type { PatchBuyerPreferenceExtensions } from "./types";
import { withBuyerExtV1 } from "./withBuyerExtV1";

type SearchPrefsNeighborhoodProps = {
  isEditMode: boolean;
  patch: PatchBuyerPreferenceExtensions;
  neigh: BuyerNeighborhoodPrefs;
};

export function SearchPrefsNeighborhood({
  isEditMode,
  patch,
  neigh,
}: SearchPrefsNeighborhoodProps) {
  return (
    <Box className="gap-4">
      <Title size="sm" as="h3" className="mb-3 text-base">
        {SECTION_TITLES.SEARCH_PREFS_NEIGHBORHOOD}
      </Title>
      <AlignedRow
        breakIntoRows="sm"
        gap="lg"
        justify="start"
        items={[
          {
            title: <Label>{FIELD_LABELS.WALKABILITY_IMPORTANCE}</Label>,
            content: isEditMode ? (
              <Dropdown
                value={neigh.walkability_importance ?? ""}
                onChange={(value) =>
                  patch((p) => {
                    const b = withBuyerExtV1(p);
                    return {
                      ...b,
                      neighborhood: {
                        ...b.neighborhood,
                        walkability_importance: value || undefined,
                      },
                    };
                  })
                }
                options={WALKABILITY_OPTIONS}
                placeholder="Select walkability importance"
              />
            ) : (
              <Box
                className={`mobile-input bg-background-base ${profileFieldValueClassName(
                  neigh.walkability_importance
                )}`}
              >
                {WALKABILITY_OPTIONS.find((o) => o.value === neigh.walkability_importance)?.label ??
                  PROFILE_NOT_SPECIFIED_LABEL}
              </Box>
            ),
          },
          {
            title: <Label>{FIELD_LABELS.CRIME_IMPORTANCE}</Label>,
            content: isEditMode ? (
              <Dropdown
                value={neigh.crime_importance ?? ""}
                onChange={(value) =>
                  patch((p) => {
                    const b = withBuyerExtV1(p);
                    return {
                      ...b,
                      neighborhood: {
                        ...b.neighborhood,
                        crime_importance: value || undefined,
                      },
                    };
                  })
                }
                options={WALKABILITY_OPTIONS}
                placeholder="Select neighborhood safety importance"
              />
            ) : (
              <Box
                className={`mobile-input bg-background-base ${profileFieldValueClassName(
                  neigh.crime_importance
                )}`}
              >
                {WALKABILITY_OPTIONS.find((o) => o.value === neigh.crime_importance)?.label ??
                  PROFILE_NOT_SPECIFIED_LABEL}
              </Box>
            ),
          },
          {
            title: <Label>{FIELD_LABELS.PET_FRIENDLY_AREA}</Label>,
            content: isEditMode ? (
              <Dropdown
                value={neigh.pet_friendly_area ?? ""}
                onChange={(value) =>
                  patch((p) => {
                    const b = withBuyerExtV1(p);
                    return {
                      ...b,
                      neighborhood: {
                        ...b.neighborhood,
                        pet_friendly_area: value || undefined,
                      },
                    };
                  })
                }
                options={WALKABILITY_OPTIONS}
                placeholder="Select pet-friendly area importance"
              />
            ) : (
              <Box
                className={`mobile-input bg-background-base ${profileFieldValueClassName(
                  neigh.pet_friendly_area
                )}`}
              >
                {WALKABILITY_OPTIONS.find((o) => o.value === neigh.pet_friendly_area)?.label ??
                  PROFILE_NOT_SPECIFIED_LABEL}
              </Box>
            ),
          },
        ]}
      />
    </Box>
  );
}
