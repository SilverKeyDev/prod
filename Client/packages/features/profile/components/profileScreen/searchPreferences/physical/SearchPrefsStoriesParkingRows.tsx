import React from "react";

import { PROFILE_FIELDS_ROW_PROPS } from "packages/features/profile/components/layout";
import type { BuyerPhysicalPrefs } from "packages/features/profile/types/sections/buyerPreferenceExtensions";
import {
  FIELD_LABELS,
  PARKING_TYPE_OPTIONS,
  PROFILE_NOT_SPECIFIED_LABEL,
  profileFieldValueClassName,
  STORIES_PREFERENCE_OPTIONS,
} from "packages/features/profile/utils";
import { FormFieldLabel as Label } from "packages/ui";
import { Box } from "packages/ui/components/structure/primitives";

import AlignedRow from "@/components/layout/AlignedRow";
import { Dropdown } from "@/components/ui";

import type { PatchBuyerPreferenceExtensions } from "../types";
import { withBuyerExtV1 } from "../withBuyerExtV1";

type SearchPrefsStoriesParkingRowsProps = {
  isEditMode: boolean;
  patch: PatchBuyerPreferenceExtensions;
  phys: BuyerPhysicalPrefs;
};

export function SearchPrefsStoriesParkingRows({
  isEditMode,
  patch,
  phys,
}: SearchPrefsStoriesParkingRowsProps) {
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

  return <AlignedRow {...PROFILE_FIELDS_ROW_PROPS} items={storiesParkingRowItems} />;
}
