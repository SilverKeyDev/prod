import React from "react";

import Input from "@ui/form/Input";

import { useIsAgent } from "packages/hooks/store/useIsAgent";
import { Pressable } from "packages/ui/components/primitives";
import { Box } from "packages/ui/components/primitives";
import { Text } from "packages/ui/components/primitives";
import { MOBILE_TEXT_INPUT_CLASS } from "packages/ui/styles/nativeFormStyles.native";

import {
  effectiveIsAgentForOptionalBuyerUi,
  FIELD_LABELS,
  type OnboardingData,
} from "@/features/profile/utils";

type DemographicsStepProps = {
  formData: OnboardingData;
  updateFormData: (field: string | number | symbol, value: unknown) => void;
};

const HAS_BUYERS_AGENT_OPTIONS = [
  { value: "yes", label: "Yes" },
  { value: "no", label: "No" },
];

/** Mobile onboarding demographics. Role picker runs first; immutable after onboarding. */
export function DemographicsStep({ formData, updateFormData }: DemographicsStepProps) {
  const authIsAgent = useIsAgent();
  const showBuyerFacingDemographics = !effectiveIsAgentForOptionalBuyerUi({
    authIsAgent,
    formIsAgent: formData.is_agent,
  });
  const toggleLookingForAgent = () => {
    updateFormData("looking_for_buyers_agent", !formData.looking_for_buyers_agent);
  };

  return (
    <Box className="gap-5">
      <Text className="text-text-primary text-lg font-semibold">About You</Text>

      <Box>
        <Text className="text-text-secondary mb-2 text-sm font-medium">{FIELD_LABELS.AGE}</Text>
        <Input
          value={formData.age?.toString() ?? ""}
          onValueChange={(v) => updateFormData("age", v ? parseInt(v, 10) : undefined)}
          placeholder="Enter your age"
          keyboardType="number-pad"
          className={`${MOBILE_TEXT_INPUT_CLASS} w-full`}
        />
      </Box>

      <Box>
        <Text className="text-text-secondary mb-2 text-sm font-medium">
          {FIELD_LABELS.CHILDREN_COUNT}
        </Text>
        <Input
          value={formData.children_count?.toString() ?? ""}
          onValueChange={(v) => updateFormData("children_count", v ? parseInt(v, 10) : undefined)}
          placeholder="Number of children"
          keyboardType="number-pad"
          className={MOBILE_TEXT_INPUT_CLASS}
        />
      </Box>

      {showBuyerFacingDemographics && (
        <>
          <Box className="gap-3">
            <Box>
              <Text className="text-text-secondary mb-2 text-sm font-medium">
                {FIELD_LABELS.HAS_BUYERS_AGENT}
              </Text>
              <Box className="flex flex-row gap-3">
                {HAS_BUYERS_AGENT_OPTIONS.map((opt) => {
                  const selected = formData.has_buyers_agent === opt.value;
                  return (
                    <Pressable
                      key={opt.value}
                      onPress={() => updateFormData("has_buyers_agent", opt.value)}
                      className={`flex-1 rounded-lg border-2 px-4 py-3 ${
                        selected
                          ? "border-primary bg-primary"
                          : "border-border bg-background-surface"
                      }`}
                    >
                      <Text
                        className={`text-center text-base font-medium ${
                          selected ? "text-primary" : "text-text-secondary"
                        }`}
                      >
                        {opt.label}
                      </Text>
                    </Pressable>
                  );
                })}
              </Box>
            </Box>

            {formData.has_buyers_agent === "no" && (
              <Pressable
                onPress={toggleLookingForAgent}
                className="border-border bg-background-surface flex flex-row items-center gap-3 rounded-lg border px-4 py-3"
              >
                <Box
                  className={`h-5 w-5 items-center justify-center rounded border ${
                    formData.looking_for_buyers_agent
                      ? "border-primary bg-primary"
                      : "border-border bg-background-base"
                  }`}
                />
                <Text className="text-text-primary text-sm font-medium">
                  I am looking for a buyer&apos;s agent
                </Text>
              </Pressable>
            )}
          </Box>
        </>
      )}
    </Box>
  );
}
