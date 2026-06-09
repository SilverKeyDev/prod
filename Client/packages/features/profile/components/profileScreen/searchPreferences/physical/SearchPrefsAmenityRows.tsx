import React from "react";

import { PROFILE_FIELDS_ROW_PROPS } from "packages/features/profile/components/layout";
import type { PatchBuyerPreferenceExtensions } from "packages/features/profile/components/profileScreen/searchPreferences/types";
import { withBuyerExtV1 } from "packages/features/profile/components/profileScreen/searchPreferences/withBuyerExtV1";
import type { BuyerPhysicalPrefs } from "packages/features/profile/types/sections/buyerPreferenceExtensions";
import {
  ACCESSIBILITY_NEEDS_OPTIONS,
  FIELD_LABELS,
  parseAccessibilityNeeds,
  PROFILE_NOT_SPECIFIED_LABEL,
  profileFieldValueClassName,
  serializeAccessibilityNeeds,
} from "packages/features/profile/utils";
import { WALKABILITY_OPTIONS } from "packages/features/profile/utils/public/constants";
import { FormFieldLabel as Label, OptionTagInput } from "packages/ui";
import { Box } from "packages/ui/components/structure/primitives";

import AlignedRow from "@/components/layout/AlignedRow";
import { Dropdown } from "@/components/ui";

type SearchPrefsAmenityRowsProps = {
  isEditMode: boolean;
  patch: PatchBuyerPreferenceExtensions;
  phys: BuyerPhysicalPrefs;
};

export function SearchPrefsAmenityRows({ isEditMode, patch, phys }: SearchPrefsAmenityRowsProps) {
  const accessibilityNeeds = parseAccessibilityNeeds(phys.accessibility_needs);

  return (
    <>
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
    </>
  );
}
