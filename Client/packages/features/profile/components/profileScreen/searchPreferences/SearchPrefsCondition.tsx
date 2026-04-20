import React from "react";

import type { BuyerConditionPrefs } from "packages/features/profile/types/buyerPreferenceExtensions";
import {
  FIELD_LABELS,
  LISTING_STATUS_PROFILE_OPTIONS,
  type OnboardingData,
  PROFILE_NOT_SPECIFIED_LABEL,
  SECTION_TITLES,
} from "packages/features/profile/utils";
import { Box } from "packages/ui/components/primitives";
import Title from "packages/ui/components/text/Title";

import AlignedRow from "@/components/layout/AlignedRow";
import { Dropdown } from "@/components/ui";
import Label from "@/features/profile/components/settings/inputs/Label";
import OptionTagInput, {
  type OptionTagOption,
} from "@/features/profile/components/settings/inputs/tags/OptionTagInput.web";
import { profileFieldValueClassName } from "@/features/profile/utils";

import type { PatchBuyerPreferenceExtensions } from "./types";
import { withBuyerExtV1 } from "./withBuyerExtV1";

type SearchPrefsConditionProps = {
  isEditMode: boolean;
  patch: PatchBuyerPreferenceExtensions;
  listingStatus: OnboardingData["listing_status"];
  updateField: (field: keyof OnboardingData, value: unknown) => void;
  cond: BuyerConditionPrefs;
};

const CONDITION_PREF_OPTIONS: OptionTagOption[] = [
  { value: "prefer_price_reduced", label: FIELD_LABELS.PREFER_PRICE_REDUCED },
  { value: "prefer_virtual_tour", label: FIELD_LABELS.PREFER_VIRTUAL_TOUR },
  { value: "prefer_open_house", label: FIELD_LABELS.PREFER_OPEN_HOUSE },
  { value: "foreclosure_ok", label: FIELD_LABELS.FORECLOSURE_OK },
];

function selectedConditionPrefs(cond: BuyerConditionPrefs): string[] {
  return CONDITION_PREF_OPTIONS.map((option) => option.value).filter(
    (key) => cond[key as keyof BuyerConditionPrefs] === true
  );
}

function toConditionPrefs(selected: string[]): BuyerConditionPrefs {
  const selectedSet = new Set(selected);
  return {
    prefer_price_reduced: selectedSet.has("prefer_price_reduced") ? true : undefined,
    prefer_virtual_tour: selectedSet.has("prefer_virtual_tour") ? true : undefined,
    prefer_open_house: selectedSet.has("prefer_open_house") ? true : undefined,
    foreclosure_ok: selectedSet.has("foreclosure_ok") ? true : undefined,
  };
}

export function SearchPrefsCondition({
  isEditMode,
  patch,
  listingStatus,
  updateField,
  cond,
}: SearchPrefsConditionProps) {
  const conditionSelections = selectedConditionPrefs(cond);

  return (
    <Box className="gap-4">
      <Title size="sm" as="h3" className="mb-3 text-base">
        {SECTION_TITLES.SEARCH_PREFS_CONDITION}
      </Title>
      <Box className="flex flex-col gap-6">
        <AlignedRow
          breakIntoRows="sm"
          gap="lg"
          justify="start"
          items={[
            {
              title: <Label>{FIELD_LABELS.LISTING_STATUS_FILTER}</Label>,
              content: isEditMode ? (
                <Dropdown
                  value={listingStatus ?? ""}
                  onChange={(value) => updateField("listing_status", value || undefined)}
                  options={LISTING_STATUS_PROFILE_OPTIONS}
                  placeholder="Select listing status"
                />
              ) : (
                <Box
                  className={`mobile-input bg-background-base ${profileFieldValueClassName(
                    listingStatus
                  )}`}
                >
                  {LISTING_STATUS_PROFILE_OPTIONS.find((o) => o.value === listingStatus)?.label ??
                    PROFILE_NOT_SPECIFIED_LABEL}
                </Box>
              ),
            },
          ]}
        />
        <Box className="space-y-2">
          <Label>Condition and listing preferences</Label>
          <OptionTagInput
            options={CONDITION_PREF_OPTIONS}
            value={conditionSelections}
            onChange={(selected) =>
              patch((p) => {
                const b = withBuyerExtV1(p);
                return {
                  ...b,
                  condition: { ...b.condition, ...toConditionPrefs(selected) },
                };
              })
            }
            isEditMode={isEditMode}
          />
        </Box>
      </Box>
    </Box>
  );
}
