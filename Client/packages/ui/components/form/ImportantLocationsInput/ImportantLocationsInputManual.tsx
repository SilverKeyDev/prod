import React from "react";

import { DOTTED_BORDER_LIGHT_GRAY } from "packages/ui/components/form/fileUploadStyles";
import { Box } from "packages/ui/components/primitives";
import { Pressable } from "packages/ui/components/primitives";
import { PrimitiveInput } from "packages/ui/components/primitives";
import { Text } from "packages/ui/components/primitives";
import type { ImportantLocation } from "packages/utils/profile";

export type ImportantLocationsInputManualProps = {
  locations: ImportantLocation[];
  onChange: (locations: ImportantLocation[]) => void;
  isEditMode?: boolean;
};

export function ImportantLocationsInputManual({
  locations,
  onChange,
  isEditMode = true,
}: ImportantLocationsInputManualProps) {
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
        <Box className="border-border bg-primary-muted rounded-lg border px-4 py-3">
          <Text className="text-sm text-gray-500">No locations set yet.</Text>
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
          <Box key={index} className="gap-2">
            <Text className="text-sm font-medium text-gray-700">
              Location {displayList.length > 1 ? index + 1 : ""}
            </Text>
            <Box className="gap-2">
              <PrimitiveInput
                value={loc.address ?? ""}
                onValueChange={(v) => handleAddressChange(index, v ?? "")}
                placeholder="Address or city"
                className={`bg-background-surface text-text-primary rounded-lg px-4 py-3 text-base ${DOTTED_BORDER_LIGHT_GRAY}`}
              />
              <PrimitiveInput
                value={commuteText}
                onValueChange={(v) => handleCommuteChange(index, v ?? "")}
                placeholder="Max commute time (minutes, optional)"
                keyboardType="number-pad"
                className={`bg-background-surface text-text-primary rounded-lg px-4 py-3 text-base ${DOTTED_BORDER_LIGHT_GRAY}`}
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
        className={`bg-background-surface rounded-lg py-3 ${DOTTED_BORDER_LIGHT_GRAY}`}
      >
        <Text className="text-center text-sm font-medium text-neutral-700">
          Add another location
        </Text>
      </Pressable>
    </Box>
  );
}
