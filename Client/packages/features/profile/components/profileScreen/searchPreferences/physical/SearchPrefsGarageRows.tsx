import React from "react";

import { PROFILE_FIELDS_ROW_PROPS } from "packages/features/profile/components/layout";
import type { BuyerPhysicalPrefs } from "packages/features/profile/types/sections/buyerPreferenceExtensions";
import {
  FIELD_LABELS,
  PROFILE_NOT_SPECIFIED_LABEL,
  profileFieldValueClassName,
} from "packages/features/profile/utils";
import { Input, OliveCheckbox } from "packages/ui";
import { FormFieldLabel as Label } from "packages/ui";
import { Box, Pressable } from "packages/ui/components/structure/primitives";

import AlignedRow from "@/components/layout/AlignedRow";

import type { PatchBuyerPreferenceExtensions } from "../types";
import { withBuyerExtV1 } from "../withBuyerExtV1";

type SearchPrefsGarageRowsProps = {
  isEditMode: boolean;
  patch: PatchBuyerPreferenceExtensions;
  phys: BuyerPhysicalPrefs;
};

export function SearchPrefsGarageRows({ isEditMode, patch, phys }: SearchPrefsGarageRowsProps) {
  const shouldShowGarageMinCars = phys.garage_required === true;

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

  return <AlignedRow {...PROFILE_FIELDS_ROW_PROPS} items={garageRowItems} />;
}
