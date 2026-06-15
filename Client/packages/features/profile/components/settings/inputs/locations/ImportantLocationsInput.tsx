import React from "react";

import type { ImportantLocation } from "packages/features/profile/utils/public/importantLocations";
import { PrimitiveInput } from "packages/ui/components/structure/primitives";
import { Pressable } from "packages/ui/components/structure/primitives";
import { Box } from "packages/ui/components/structure/primitives";
import { Text } from "packages/ui/components/structure/primitives";

type ImportantLocationsInputProps = {
  locations: ImportantLocation[];
  onChange: (locations: ImportantLocation[]) => void;
  scriptsReady?: boolean;
  isEditMode?: boolean;
  addButtonLabel?: string;
};

export function ImportantLocationsInput({
  locations,
  onChange,
  isEditMode = true,
}: ImportantLocationsInputProps) {
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
        <Box className="border-border bg-background-base rounded-lg border px-4 py-3">
          <Text className="text-text-secondary text-sm">No locations set yet.</Text>
        </Box>
      );
    }

    return (
      <Box className="gap-2">
        {safeLocations.map((location, index) => (
          <Box
            key={index}
            className="border-border bg-background-surface rounded-lg border px-4 py-3"
          >
            <Text className="text-text-primary text-sm font-medium">
              {location.address ?? "Location"}
            </Text>
            {location.commute_tolerance != null ? (
              <Text className="text-text-secondary mt-1 text-xs">
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
          <Box key={index} className="gap-2">
            <Text className="text-text-secondary text-sm font-medium">
              Location {displayList.length > 1 ? index + 1 : ""}
            </Text>
            <Box className="gap-2">
              <PrimitiveInput
                value={loc.address ?? ""}
                onValueChange={(v) => handleAddressChange(index, v ?? "")}
                placeholder="Address or city"
                className="border-border bg-background-surface text-text-primary rounded-lg border px-4 py-3 text-base"
              />
              <PrimitiveInput
                value={commuteText}
                onValueChange={(v) => handleCommuteChange(index, v ?? "")}
                placeholder="Max commute time (minutes, optional)"
                keyboardType="number-pad"
                className="border-border bg-background-surface text-text-primary rounded-lg border px-4 py-3 text-base"
              />
            </Box>
            <Pressable
              onPress={() => handleRemoveLocation(index)}
              className="border-border bg-background-surface self-start rounded-lg border px-3 py-2"
            >
              <Text className="text-sm font-medium text-red-600">Remove</Text>
            </Pressable>
          </Box>
        );
      })}

      <Pressable
        onPress={handleAddLocation}
        className="border-border bg-background-base rounded-lg border-2 border-dashed py-3"
      >
        <Text className="text-text-secondary text-center text-sm font-medium">
          Add another location
        </Text>
      </Pressable>
    </Box>
  );
}
