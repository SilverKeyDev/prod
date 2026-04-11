import React from "react";

import { useIsAgent } from "packages/hooks/store/useIsAgent";
import { Pressable } from "packages/ui/components/primitives";
import { Box } from "packages/ui/components/primitives";
import { Text } from "packages/ui/components/primitives";

import {
  AGENT_OPTIONAL_BUYER_SEARCH_PREFERENCES_HINT,
  effectiveIsAgentForOptionalBuyerUi,
  FIELD_LABELS,
  HOUSING_TYPE_OPTIONS,
  MUST_HAVE_OPTIONS,
  type OnboardingData,
  parseHousingTypes,
  SECTION_TITLES,
  serializeHousingTypes,
} from "@/features/profile/utils";

import { HousingNumberFields } from "./HousingNumberFields.native";

type Props = {
  formData: OnboardingData;
  updateFormData: (field: string | number | symbol, value: unknown) => void;
};

export function HousingStepEssentials({ formData, updateFormData }: Props) {
  const authIsAgent = useIsAgent();
  const showAgentOptionalBuyerCallout = effectiveIsAgentForOptionalBuyerUi({
    authIsAgent,
    formIsAgent: formData.is_agent,
  });
  const housingTypes = parseHousingTypes(formData.preferred_housing_type ?? "");
  const mustHave = Array.isArray(formData.must_have) ? formData.must_have : [];

  const toggleHousingType = (value: string) => {
    const exists = housingTypes.includes(value);
    const next = exists
      ? housingTypes.filter((v) => v !== value)
      : [...housingTypes, value];
    updateFormData("preferred_housing_type", serializeHousingTypes(next));
  };

  const toggleMustHave = (value: string) => {
    const exists = mustHave.includes(value);
    const next = exists
      ? mustHave.filter((v) => v !== value)
      : [...mustHave, value];
    updateFormData("must_have", next);
  };

  return (
    <Box className="gap-6">
      <Text className="text-text-primary text-lg font-semibold">
        {SECTION_TITLES.HOUSING_ESSENTIALS}
      </Text>
      {showAgentOptionalBuyerCallout && (
        <Box className="border-border bg-background-surface rounded-lg border px-3 py-2">
          <Text className="text-text-secondary text-xs">
            {AGENT_OPTIONAL_BUYER_SEARCH_PREFERENCES_HINT}
          </Text>
        </Box>
      )}

      <HousingNumberFields
        formData={formData}
        updateFormData={updateFormData}
      />

      <Box>
        <Text className="text-text-secondary mb-2 text-sm font-medium">
          {FIELD_LABELS.PREFERRED_HOUSING_TYPE}
        </Text>
        <Text className="text-text-secondary mb-3 text-xs">
          Pick one or more home types you&apos;re open to.
        </Text>
        <Box className="flex flex-row flex-wrap gap-2">
          {HOUSING_TYPE_OPTIONS.map((option) => {
            const selected = housingTypes.includes(option.value);
            return (
              <Pressable
                key={option.value}
                onPress={() => toggleHousingType(option.value)}
                className={`rounded-full border px-4 py-2 ${
                  selected
                    ? "border-primary bg-primary"
                    : "border-border bg-background-surface"
                }`}
              >
                <Text
                  className={`text-xs font-medium ${
                    selected ? "text-primary" : "text-text-secondary"
                  }`}
                >
                  {option.label}
                </Text>
              </Pressable>
            );
          })}
        </Box>
      </Box>

      <Box>
        <Text className="text-text-secondary mb-2 text-sm font-medium">
          {FIELD_LABELS.MUST_HAVE}
        </Text>
        <Text className="text-text-secondary mb-3 text-xs">
          Mark a few must-have features. We&apos;ll prioritize homes that match.
        </Text>
        <Box className="flex flex-row flex-wrap gap-2">
          {MUST_HAVE_OPTIONS.map((option) => {
            const selected = mustHave.includes(option.value);
            return (
              <Pressable
                key={option.value}
                onPress={() => toggleMustHave(option.value)}
                className={`rounded-full border px-4 py-2 ${
                  selected
                    ? "border-primary bg-primary"
                    : "border-border bg-background-surface"
                }`}
              >
                <Text
                  className={`text-xs font-medium ${
                    selected ? "text-primary" : "text-text-secondary"
                  }`}
                >
                  {option.label}
                </Text>
              </Pressable>
            );
          })}
        </Box>
      </Box>
    </Box>
  );
}
