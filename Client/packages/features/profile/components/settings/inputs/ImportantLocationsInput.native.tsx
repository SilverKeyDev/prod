import React from "react";

import { Pressable } from "packages/ui/components/primitives";
import { Box } from "packages/ui/components/primitives/box";
import { Input } from "packages/ui/components/primitives/input";
import { Text } from "packages/ui/components/primitives/text";
import { MOBILE_TEXT_INPUT_CLASS } from "packages/ui/styles/nativeFormStyles.native";

import type { ImportantLocation } from "@/features/profile/utils/importantLocations";

type ImportantLocationsInputNativeProps = {
  locations: ImportantLocation[];
  onChange: (locations: ImportantLocation[]) => void;
  isEditMode?: boolean;
};

export function ImportantLocationsInputNative({
  locations,
  onChange,
  isEditMode = true,
}: ImportantLocationsInputNativeProps) {
  const safeLocations = Array.isArray(locations) ? locations : [];
  const displayList =
    safeLocations.length > 0
      ? safeLocations
      : [
          {
            address: "",
          },
        ];

  const handleAddressChange = (index: number, address: string) => {
    const trimmed = address ?? "";
    const next = [...safeLocations];
    const existing = next[index] ?? { address: "" };
    const updated: ImportantLocation = {
      ...existing,
      address: trimmed,
    };
    if (next[index]) {
      next[index] = updated;
    } else {
      next.push(updated);
    }

    const filtered = next.filter((loc) => (loc.address ?? "").toString().trim().length > 0);
    onChange(filtered);
  };

  const handleCommuteChange = (index: number, minutesText: string) => {
    const text = minutesText.trim();
    const parsed = text === "" ? undefined : Number.parseInt(text, 10);
    const value = parsed === undefined || Number.isNaN(parsed) || parsed < 0 ? undefined : parsed;

    const next = [...safeLocations];
    const existing = next[index] ?? { address: "" };
    const updated: ImportantLocation = {
      ...existing,
      commute_tolerance: value,
    };

    if (next[index]) {
      next[index] = updated;
    } else {
      next.push(updated);
    }

    const filtered = next.filter((loc) => (loc.address ?? "").toString().trim().length > 0);
    onChange(filtered);
  };

  const handleAddLocation = () => {
    onChange([
      ...safeLocations,
      {
        address: "",
        commute_tolerance: safeLocations[0]?.commute_tolerance,
      },
    ]);
  };

  const handleRemoveLocation = (index: number) => {
    const next = safeLocations.filter((_, i) => i !== index);
    onChange(next);
  };

  if (!isEditMode) {
    if (!safeLocations.length) {
      return (
        <Box className="rounded-lg border border-gray-200 bg-gray-50 px-4 py-3">
          <Text className="text-sm text-gray-500">No locations set yet.</Text>
        </Box>
      );
    }

    return (
      <Box className="gap-2">
        {safeLocations.map((location, index) => (
          <Box
            // eslint-disable-next-line react/no-array-index-key -- locations do not have stable ids yet
            key={index}
            className="rounded-lg border border-gray-200 bg-white px-4 py-3"
          >
            <Text className="text-sm font-medium text-gray-900">
              {location.address ?? "Location"}
            </Text>
            {location.commute_tolerance != null ? (
              <Text className="mt-1 text-xs text-gray-600">
                Commute tolerance: {location.commute_tolerance} min
              </Text>
            ) : null}
          </Box>
        ))}
      </Box>
    );
  }

  return (
    <Box className="gap-4">
      {displayList.map((loc, index) => {
        const commuteText = loc.commute_tolerance != null ? String(loc.commute_tolerance) : "";
        return (
          <Box
            // eslint-disable-next-line react/no-array-index-key -- locations do not have stable ids yet
            key={index}
            className="gap-2"
          >
            <Text className="text-sm font-medium text-gray-700">
              Location {displayList.length > 1 ? index + 1 : ""}
            </Text>
            <Box className="gap-2">
              <Input
                value={loc.address ?? ""}
                onValueChange={(v) => handleAddressChange(index, v ?? "")}
                placeholder="Address or city"
                className={MOBILE_TEXT_INPUT_CLASS}
              />
              <Input
                value={commuteText}
                onValueChange={(v) => handleCommuteChange(index, v ?? "")}
                placeholder="Commute max (minutes, optional)"
                keyboardType="number-pad"
                className={MOBILE_TEXT_INPUT_CLASS}
              />
            </Box>
            {displayList.length > 1 && (
              <Pressable
                onPress={() => handleRemoveLocation(index)}
                className="self-start rounded-lg border border-gray-200 bg-white px-3 py-2"
              >
                <Text className="text-sm font-medium text-red-600">Remove</Text>
              </Pressable>
            )}
          </Box>
        );
      })}

      <Pressable
        onPress={handleAddLocation}
        className="rounded-lg border-2 border-dashed border-gray-300 bg-gray-50 py-3"
      >
        <Text className="text-center text-sm font-medium text-gray-600">Add another location</Text>
      </Pressable>
    </Box>
  );
}
