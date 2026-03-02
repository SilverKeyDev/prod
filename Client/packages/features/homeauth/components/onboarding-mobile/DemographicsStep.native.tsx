import React from "react";

import { Pressable } from "packages/ui/components/primitives";
import { Box } from "packages/ui/components/primitives/box";
import { Input } from "packages/ui/components/primitives/input";
import { Text } from "packages/ui/components/primitives/text";
import { MOBILE_TEXT_INPUT_CLASS } from "packages/ui/styles/nativeFormStyles.native";

import { FIELD_LABELS, IS_AGENT_OPTIONS, type OnboardingData } from "@/features/profile/utils";

type DemographicsStepProps = {
  formData: OnboardingData;
  updateFormData: (field: string | number | symbol, value: unknown) => void;
};

export function DemographicsStep({ formData, updateFormData }: DemographicsStepProps) {
  return (
    <Box className="gap-5">
      <Text className="text-lg font-semibold text-gray-900">About You</Text>

      <Box>
        <Text className="mb-2 text-sm font-medium text-gray-700">{FIELD_LABELS.IS_AGENT}</Text>
        <Box className="flex flex-row gap-3">
          {IS_AGENT_OPTIONS.map((opt) => (
            <Pressable
              key={opt.value}
              onPress={() => updateFormData("is_agent", opt.value)}
              className={`flex-1 rounded-lg border-2 px-4 py-3 ${
                formData.is_agent === opt.value
                  ? "border-brand-accent bg-brand-accent/10"
                  : "border-gray-200 bg-white"
              }`}
            >
              <Text
                className={`text-center text-base font-medium ${
                  formData.is_agent === opt.value ? "text-brand-accent" : "text-gray-700"
                }`}
              >
                {opt.label}
              </Text>
            </Pressable>
          ))}
        </Box>
      </Box>

      <Box>
        <Text className="mb-2 text-sm font-medium text-gray-700">{FIELD_LABELS.AGE}</Text>
        <Input
          value={formData.age?.toString() ?? ""}
          onValueChange={(v) => updateFormData("age", v ? parseInt(v, 10) : undefined)}
          placeholder="Enter your age"
          keyboardType="number-pad"
          className={MOBILE_TEXT_INPUT_CLASS}
        />
      </Box>

      <Box>
        <Text className="mb-2 text-sm font-medium text-gray-700">
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
    </Box>
  );
}
