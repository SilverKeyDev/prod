import React from "react";

import { PROFILE_FIELDS_ROW_PROPS } from "packages/features/profile/components/layout";
import type { BuyerPhysicalPrefs } from "packages/features/profile/types/sections/buyerPreferenceExtensions";
import {
  ACCESSIBILITY_NEEDS_OPTIONS,
  FIELD_LABELS,
  PARKING_TYPE_OPTIONS,
  parseAccessibilityNeeds,
  PROFILE_NOT_SPECIFIED_LABEL,
  SECTION_TITLES,
  serializeAccessibilityNeeds,
  STORIES_PREFERENCE_OPTIONS,
} from "packages/features/profile/utils";
import { WALKABILITY_OPTIONS } from "packages/features/profile/utils/public/constants";
import { Input, OliveCheckbox } from "packages/ui";
import { Pressable } from "packages/ui/components/structure/primitives";
import { Box } from "packages/ui/components/structure/primitives";
import Title from "packages/ui/components/structure/text/Title";

import AlignedRow from "@/components/layout/AlignedRow";
import { Dropdown } from "@/components/ui";
import Label from "@/features/profile/components/settings/inputs/Label";
import OptionTagInput from "@/features/profile/components/settings/inputs/tags/OptionTagInput.web";
import { profileFieldValueClassName } from "@/features/profile/utils";

import type { PatchBuyerPreferenceExtensions } from "./types";
import { withBuyerExtV1 } from "./withBuyerExtV1";

type SearchPrefsPhysicalProps = {
  isEditMode: boolean;
  patch: PatchBuyerPreferenceExtensions;
  phys: BuyerPhysicalPrefs;
};

export function SearchPrefsPhysical({ isEditMode, patch, phys }: SearchPrefsPhysicalProps) {
  const shouldShowGarageMinCars = phys.garage_required === true;
  const accessibilityNeeds = parseAccessibilityNeeds(phys.accessibility_needs);

  const garageRowItems = [
    {
      title: <Label>{FIELD_LABELS.GARAGE_REQUIRED}</Label>,
      content: isEditMode ? (
        <Pressable
          onPress={() =>
            patch((p) => {
              const b = withBuyerExtV1(p);
              const next = !b.physical?.garage_required;
              return {
                ...b,
                physical: { ...b.physical, garage_required: next },
              };
            })
          }
          className="flex-row items-center gap-3 self-start"
          label={FIELD_LABELS.GARAGE_REQUIRED}
        >
          <OliveCheckbox checked={!!phys.garage_required} />
        </Pressable>
      ) : (
        <Box
          className={`mobile-input bg-background-base ${profileFieldValueClassName(
            phys.garage_required
          )}`}
        >
          {phys.garage_required === true
            ? "Yes"
            : phys.garage_required === false
              ? "No"
              : PROFILE_NOT_SPECIFIED_LABEL}
        </Box>
      ),
    },
    ...(shouldShowGarageMinCars
      ? [
          {
            title: <Label>{FIELD_LABELS.GARAGE_MIN_CARS}</Label>,
            content: isEditMode ? (
              <Input
                type="number"
                value={phys.garage_min_cars?.toString() ?? ""}
                onChange={(e: React.ChangeEvent<HTMLInputElement>) => {
                  const raw = e.target.value;
                  patch((p) => {
                    const b = withBuyerExtV1(p);
                    const n = parseInt(raw, 10);
                    return {
                      ...b,
                      physical: {
                        ...b.physical,
                        garage_min_cars: Number.isNaN(n) ? undefined : n,
                      },
                    };
                  });
                }}
                placeholder="e.g. 2"
              />
            ) : (
              <Box
                className={`mobile-input bg-background-base ${profileFieldValueClassName(
                  phys.garage_min_cars
                )}`}
              >
                {phys.garage_min_cars ?? PROFILE_NOT_SPECIFIED_LABEL}
              </Box>
            ),
          },
        ]
      : []),
  ];

  const storiesParkingRowItems = [
    {
      title: <Label>{FIELD_LABELS.STORIES_PREFERENCE}</Label>,
      content: isEditMode ? (
        <Dropdown
          value={phys.stories_preference ?? ""}
          onChange={(value) =>
            patch((p) => {
              const b = withBuyerExtV1(p);
              return {
                ...b,
                physical: {
                  ...b.physical,
                  stories_preference: value || undefined,
                },
              };
            })
          }
          options={STORIES_PREFERENCE_OPTIONS}
          placeholder="Select stories preference"
        />
      ) : (
        <Box
          className={`mobile-input bg-background-base ${profileFieldValueClassName(
            phys.stories_preference
          )}`}
        >
          {STORIES_PREFERENCE_OPTIONS.find((o) => o.value === phys.stories_preference)?.label ??
            PROFILE_NOT_SPECIFIED_LABEL}
        </Box>
      ),
    },
    {
      title: <Label>{FIELD_LABELS.PARKING_TYPE}</Label>,
      content: isEditMode ? (
        <Dropdown
          value={phys.parking_type ?? ""}
          onChange={(value) =>
            patch((p) => {
              const b = withBuyerExtV1(p);
              return {
                ...b,
                physical: { ...b.physical, parking_type: value || undefined },
              };
            })
          }
          options={PARKING_TYPE_OPTIONS}
          placeholder="Select parking type"
        />
      ) : (
        <Box
          className={`mobile-input bg-background-base ${profileFieldValueClassName(
            phys.parking_type
          )}`}
        >
          {PARKING_TYPE_OPTIONS.find((o) => o.value === phys.parking_type)?.label ??
            PROFILE_NOT_SPECIFIED_LABEL}
        </Box>
      ),
    },
  ];

  return (
    <Box className="gap-4">
      <Title size="sm" as="h3" className="mb-3 text-base">
        {SECTION_TITLES.SEARCH_PREFS_PHYSICAL}
      </Title>
      <Box className="flex flex-col gap-6">
        <AlignedRow {...PROFILE_FIELDS_ROW_PROPS} items={garageRowItems} />
        <AlignedRow {...PROFILE_FIELDS_ROW_PROPS} items={storiesParkingRowItems} />
        <AlignedRow
          {...PROFILE_FIELDS_ROW_PROPS}
          items={[
            {
              title: <Label>{FIELD_LABELS.ACCESSIBILITY_NEEDS}</Label>,
              content: (
                <OptionTagInput
                  options={ACCESSIBILITY_NEEDS_OPTIONS}
                  value={accessibilityNeeds}
                  onChange={(value) =>
                    patch((p) => {
                      const b = withBuyerExtV1(p);
                      return {
                        ...b,
                        physical: {
                          ...b.physical,
                          accessibility_needs: serializeAccessibilityNeeds(value),
                        },
                      };
                    })
                  }
                  isEditMode={isEditMode}
                />
              ),
            },
            {
              title: <Label>{FIELD_LABELS.OUTDOOR_SPACE}</Label>,
              content: isEditMode ? (
                <Dropdown
                  value={phys.outdoor_space_importance ?? ""}
                  onChange={(value) =>
                    patch((p) => {
                      const b = withBuyerExtV1(p);
                      return {
                        ...b,
                        physical: {
                          ...b.physical,
                          outdoor_space_importance: value || undefined,
                        },
                      };
                    })
                  }
                  options={WALKABILITY_OPTIONS}
                  placeholder="Select outdoor space importance"
                />
              ) : (
                <Box
                  className={`mobile-input bg-background-base ${profileFieldValueClassName(
                    phys.outdoor_space_importance
                  )}`}
                >
                  {WALKABILITY_OPTIONS.find((o) => o.value === phys.outdoor_space_importance)
                    ?.label ?? PROFILE_NOT_SPECIFIED_LABEL}
                </Box>
              ),
            },
          ]}
        />
        <AlignedRow
          {...PROFILE_FIELDS_ROW_PROPS}
          items={[
            {
              title: <Label>{FIELD_LABELS.FIREPLACE}</Label>,
              content: isEditMode ? (
                <Dropdown
                  value={phys.fireplace_preference ?? ""}
                  onChange={(value) =>
                    patch((p) => {
                      const b = withBuyerExtV1(p);
                      return {
                        ...b,
                        physical: {
                          ...b.physical,
                          fireplace_preference: value || undefined,
                        },
                      };
                    })
                  }
                  options={WALKABILITY_OPTIONS}
                  placeholder="Select fireplace preference"
                />
              ) : (
                <Box
                  className={`mobile-input bg-background-base ${profileFieldValueClassName(
                    phys.fireplace_preference
                  )}`}
                >
                  {WALKABILITY_OPTIONS.find((o) => o.value === phys.fireplace_preference)?.label ??
                    PROFILE_NOT_SPECIFIED_LABEL}
                </Box>
              ),
            },
            {
              title: <Label>{FIELD_LABELS.VIEW_IMPORTANCE}</Label>,
              content: isEditMode ? (
                <Dropdown
                  value={phys.view_importance ?? ""}
                  onChange={(value) =>
                    patch((p) => {
                      const b = withBuyerExtV1(p);
                      return {
                        ...b,
                        physical: {
                          ...b.physical,
                          view_importance: value || undefined,
                        },
                      };
                    })
                  }
                  options={WALKABILITY_OPTIONS}
                  placeholder="Select view importance"
                />
              ) : (
                <Box
                  className={`mobile-input bg-background-base ${profileFieldValueClassName(
                    phys.view_importance
                  )}`}
                >
                  {WALKABILITY_OPTIONS.find((o) => o.value === phys.view_importance)?.label ??
                    PROFILE_NOT_SPECIFIED_LABEL}
                </Box>
              ),
            },
          ]}
        />
      </Box>
    </Box>
  );
}
