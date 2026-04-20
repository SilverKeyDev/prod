import { useMemo } from "react";

import { StyleSheet, TextInput } from "react-native";

import { color } from "packages/design-tokens";
import Button from "packages/ui/components/button/Button";
import { Box, ScrollView, Text } from "packages/ui/components/primitives";

import {
  estimateViewingItineraryMinutes,
  formatMinutesHuman,
} from "@/features/calendar/utils/agenda/estimateViewingItineraryDuration";

import type { ViewingStop, ViewingStopListProps } from "./viewingItineraryTypes";

function emptyStop(): ViewingStop {
  return {
    address: "",
    label: null,
    lat: null,
    lng: null,
    notes: null,
    listing_id: null,
  };
}

export function ViewingStopList({ stops, onStopsChange }: ViewingStopListProps) {
  const addStop = () => {
    onStopsChange([...stops, emptyStop()]);
  };

  const removeStop = (index: number) => {
    const next = stops.filter((_, i) => i !== index);
    onStopsChange(next.length ? next : [emptyStop()]);
  };

  const updateAddress = (index: number, address: string) => {
    const next = stops.map((s, i) => (i === index ? { ...s, address, lat: null, lng: null } : s));
    onStopsChange(next);
  };

  const durationEstimateLine = useMemo(() => {
    const est = estimateViewingItineraryMinutes({
      stops,
      legs: null,
    });
    if (!est) {
      return null;
    }
    return `Est. ${formatMinutesHuman(est.onSiteMinutes)} on-site (${
      est.minutesPerProperty
    } min avg × ${est.stopCount} tours). Fastest drive route is computed when you save.`;
  }, [stops]);

  return (
    <Box className="mt-3">
      <Text className="text-text-secondary mb-1 text-sm font-medium">Viewing stops</Text>
      <Text className="text-text-secondary mb-2 text-xs">
        Enter one address per stop. The fastest driving route is built when the event is saved.
      </Text>
      {stops.length === 0 ? (
        <Button variant="outline" size="sm" onPress={addStop} iconName="plus">
          Add stop
        </Button>
      ) : (
        <ScrollView style={styles.stopScroll} keyboardShouldPersistTaps="handled">
          {stops.map((stop, index) => (
            <Box key={index} className="mb-3 rounded-xl border border-neutral-200 p-3">
              <Box className="mb-2 flex-row flex-wrap items-center gap-2">
                <Text className="text-text-secondary text-xs font-medium">Stop {index + 1}</Text>
                <Button
                  variant="ghost"
                  size="sm"
                  className="text-rose-600"
                  onPress={() => removeStop(index)}
                  iconName="trash-2"
                >
                  Remove
                </Button>
              </Box>
              <TextInput
                value={stop.address}
                onChangeText={(v) => updateAddress(index, v)}
                placeholder="Search or type an address"
                placeholderTextColor={color("neutral.400")}
                style={styles.input}
              />
            </Box>
          ))}
        </ScrollView>
      )}
      {durationEstimateLine ? (
        <Text className="text-text-secondary border-border bg-accent-muted mt-2 rounded-lg border px-3 py-2 text-xs">
          {durationEstimateLine}
        </Text>
      ) : null}
      {stops.length > 0 ? (
        <Box className="mt-2">
          <Button variant="outline" size="sm" onPress={addStop} iconName="plus">
            Add stop
          </Button>
        </Box>
      ) : null}
    </Box>
  );
}

const styles = StyleSheet.create({
  stopScroll: { maxHeight: 280 },
  input: {
    borderWidth: 1,
    borderColor: color("neutral.200"),
    borderRadius: 12,
    paddingHorizontal: 12,
    paddingVertical: 10,
    fontSize: 16,
    backgroundColor: color("neutral.50"),
  },
});
