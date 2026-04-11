import React from "react";

import type { BuyerUtilitiesPrefs } from "packages/features/profile/types/buyerPreferenceExtensions";
import {
  FIELD_LABELS,
  HVAC_PREFERENCE_OPTIONS,
  PROFILE_NOT_SPECIFIED_LABEL,
  SECTION_TITLES,
} from "packages/features/profile/utils";
import { WALKABILITY_OPTIONS } from "packages/features/profile/utils/constants";
import { Box } from "packages/ui/components/primitives";
import Title from "packages/ui/components/text/Title";

import AlignedRow from "@/components/layout/AlignedRow";
import { Dropdown } from "@/components/ui";
import Label from "@/features/profile/components/settings/inputs/Label";
import { profileFieldValueClassName } from "@/features/profile/utils";

import type { PatchBuyerPreferenceExtensions } from "./types";
import { withBuyerExtV1 } from "./withBuyerExtV1";

type SearchPrefsUtilitiesProps = {
  isEditMode: boolean;
  patch: PatchBuyerPreferenceExtensions;
  util: BuyerUtilitiesPrefs;
};

export function SearchPrefsUtilities({
  isEditMode,
  patch,
  util,
}: SearchPrefsUtilitiesProps) {
  const rowProps = {
    breakIntoRows: "sm" as const,
    gap: "lg" as const,
    justify: "start" as const,
  };

  return (
    <Box className="gap-4">
      <Title size="sm" as="h3" className="mb-3 text-base">
        {SECTION_TITLES.SEARCH_PREFS_UTILITIES}
      </Title>
      <Box className="flex flex-col gap-6">
        <AlignedRow
          {...rowProps}
          items={[
            {
              title: <Label>{FIELD_LABELS.HVAC_PREFERENCE}</Label>,
              content: isEditMode ? (
                <Dropdown
                  value={util.hvac_preference ?? ""}
                  onChange={(value) =>
                    patch((p) => {
                      const b = withBuyerExtV1(p);
                      return {
                        ...b,
                        utilities: {
                          ...b.utilities,
                          hvac_preference: value || undefined,
                        },
                      };
                    })
                  }
                  options={HVAC_PREFERENCE_OPTIONS}
                  placeholder="Select..."
                />
              ) : (
                <Box
                  className={`mobile-input bg-background-base ${profileFieldValueClassName(
                    util.hvac_preference,
                  )}`}
                >
                  {HVAC_PREFERENCE_OPTIONS.find(
                    (o) => o.value === util.hvac_preference,
                  )?.label ?? PROFILE_NOT_SPECIFIED_LABEL}
                </Box>
              ),
            },
            {
              title: <Label>{FIELD_LABELS.UTILITIES_INCLUDED}</Label>,
              content: isEditMode ? (
                <Dropdown
                  value={util.utilities_included_importance ?? ""}
                  onChange={(value) =>
                    patch((p) => {
                      const b = withBuyerExtV1(p);
                      return {
                        ...b,
                        utilities: {
                          ...b.utilities,
                          utilities_included_importance: value || undefined,
                        },
                      };
                    })
                  }
                  options={WALKABILITY_OPTIONS}
                  placeholder="Select..."
                />
              ) : (
                <Box
                  className={`mobile-input bg-background-base ${profileFieldValueClassName(
                    util.utilities_included_importance,
                  )}`}
                >
                  {WALKABILITY_OPTIONS.find(
                    (o) => o.value === util.utilities_included_importance,
                  )?.label ?? PROFILE_NOT_SPECIFIED_LABEL}
                </Box>
              ),
            },
            {
              title: <Label>{FIELD_LABELS.SOLAR_INTEREST}</Label>,
              content: isEditMode ? (
                <Dropdown
                  value={util.solar_interest ?? ""}
                  onChange={(value) =>
                    patch((p) => {
                      const b = withBuyerExtV1(p);
                      return {
                        ...b,
                        utilities: {
                          ...b.utilities,
                          solar_interest: value || undefined,
                        },
                      };
                    })
                  }
                  options={WALKABILITY_OPTIONS}
                  placeholder="Select..."
                />
              ) : (
                <Box
                  className={`mobile-input bg-background-base ${profileFieldValueClassName(
                    util.solar_interest,
                  )}`}
                >
                  {WALKABILITY_OPTIONS.find(
                    (o) => o.value === util.solar_interest,
                  )?.label ?? PROFILE_NOT_SPECIFIED_LABEL}
                </Box>
              ),
            },
            {
              title: <Label>{FIELD_LABELS.EV_CHARGER_INTEREST}</Label>,
              content: isEditMode ? (
                <Dropdown
                  value={util.ev_charger_interest ?? ""}
                  onChange={(value) =>
                    patch((p) => {
                      const b = withBuyerExtV1(p);
                      return {
                        ...b,
                        utilities: {
                          ...b.utilities,
                          ev_charger_interest: value || undefined,
                        },
                      };
                    })
                  }
                  options={WALKABILITY_OPTIONS}
                  placeholder="Select..."
                />
              ) : (
                <Box
                  className={`mobile-input bg-background-base ${profileFieldValueClassName(
                    util.ev_charger_interest,
                  )}`}
                >
                  {WALKABILITY_OPTIONS.find(
                    (o) => o.value === util.ev_charger_interest,
                  )?.label ?? PROFILE_NOT_SPECIFIED_LABEL}
                </Box>
              ),
            },
          ]}
        />
      </Box>
    </Box>
  );
}
