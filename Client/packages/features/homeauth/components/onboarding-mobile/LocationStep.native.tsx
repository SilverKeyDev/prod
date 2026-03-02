import React from "react";

import { Pressable } from "packages/ui/components/primitives";
import { Box } from "packages/ui/components/primitives/box";
import { Input } from "packages/ui/components/primitives/input";
import { Text } from "packages/ui/components/primitives/text";
import { MOBILE_TEXT_INPUT_CLASS } from "packages/ui/styles/nativeFormStyles.native";

import { FIELD_LABELS, type OnboardingData, SECTION_TITLES } from "@/features/profile/utils";

type LocationStepProps = {
  formData: OnboardingData;
  updateFormData: (field: string | number | symbol, value: unknown) => void;
};

function ensureLocationsArray(
  locations: OnboardingData["important_locations"]
): { address: string }[] {
  if (!locations || !Array.isArray(locations)) return [];
  return locations.map((loc) => ({
    address: typeof loc === "object" && loc?.address != null ? String(loc.address) : "",
  }));
}

export function LocationStep({ formData, updateFormData }: LocationStepProps) {
  const locations = ensureLocationsArray(formData.important_locations);

  const updateAddress = (index: number, address: string) => {
    const next = [...locations];
    if (next[index]) next[index] = { address };
    else next.push({ address });
    updateFormData(
      "important_locations",
      next.filter((l) => l.address.trim() !== "")
    );
  };

  const addLocation = () => {
    updateFormData("important_locations", [...locations, { address: "" }]);
  };

  const removeLocation = (index: number) => {
    const next = locations.filter((_, i) => i !== index);
    updateFormData("important_locations", next);
  };

  const displayList = locations.length > 0 ? locations : [{ address: "" }];

  return (
    <Box className="gap-5">
      <Text className="text-lg font-semibold text-gray-900">
        {SECTION_TITLES.LOCATION_PREFERENCES}
      </Text>
      <Text className="text-sm text-gray-600">
        Add work, family, or other places you care about. We'll use these to find homes that fit
        your life.
      </Text>

      {displayList.map((loc, index) => (
        <Box key={index} className="gap-2">
          <Text className="text-sm font-medium text-gray-700">
            {FIELD_LABELS.IMPORTANT_LOCATIONS} {displayList.length > 1 ? index + 1 : ""}
          </Text>
          <Box className="flex flex-row items-center gap-2">
            <Input
              value={loc.address}
              onValueChange={(v) => updateAddress(index, v ?? "")}
              placeholder="Address or city"
              className={`flex-1 ${MOBILE_TEXT_INPUT_CLASS}`}
            />
            {displayList.length > 1 && (
              <Pressable
                onPress={() => removeLocation(index)}
                className="rounded-lg border border-gray-200 bg-white px-3 py-3"
              >
                <Text className="text-sm font-medium text-red-600">Remove</Text>
              </Pressable>
            )}
          </Box>
        </Box>
      ))}

      <Pressable
        onPress={addLocation}
        className="rounded-lg border-2 border-dashed border-gray-300 bg-gray-50 py-3"
      >
        <Text className="text-center text-sm font-medium text-gray-600">Add another location</Text>
      </Pressable>
    </Box>
  );
}
