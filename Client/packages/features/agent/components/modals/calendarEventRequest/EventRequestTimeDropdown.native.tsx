import React, { useState } from "react";

import { Modal, StyleSheet, View } from "react-native";

import { color } from "packages/design-tokens";
import { Box, ScrollView, Text, TouchableBox } from "packages/ui/components/structure/primitives";
import type { EventScheduleOption } from "packages/utils/comms/scheduling/eventRequestScheduleOptions";

export type EventRequestTimeDropdownProps = {
  value: string;
  onChange: (value: string) => void;
  options: EventScheduleOption[];
};

export function EventRequestTimeDropdown({
  value,
  onChange,
  options,
}: EventRequestTimeDropdownProps) {
  const [open, setOpen] = useState(false);
  const selectedLabel = options.find((o) => o.value === value)?.label;

  return (
    <Box className="w-full">
      <Text className="text-text-secondary mb-1 text-sm font-medium">Time</Text>
      <TouchableBox
        onPress={() => setOpen(true)}
        style={styles.trigger}
        label="Select time"
        interactionStyles={{ base: "" }}
      >
        <Text className={value ? "text-text-primary text-base" : "text-text-secondary text-base"}>
          {selectedLabel ?? "Select time"}
        </Text>
      </TouchableBox>
      <Modal visible={open} transparent animationType="fade" onRequestClose={() => setOpen(false)}>
        <View style={styles.overlay}>
          <TouchableBox
            style={StyleSheet.absoluteFillObject}
            onPress={() => setOpen(false)}
            label="Close"
            interactionStyles={{ base: "" }}
          />
          <View style={styles.sheet}>
            <Text className="text-text-primary mb-3 text-base font-semibold">Select time</Text>
            <ScrollView style={styles.list} keyboardShouldPersistTaps="handled">
              {options.map((o) => {
                const selected = value === o.value;
                const unavailable = Boolean(o.disabled);
                const availableTone = o.availabilityTone === "available";
                return (
                  <TouchableBox
                    key={o.value}
                    label={o.label}
                    onPress={() => {
                      if (unavailable) return;
                      onChange(o.value);
                      setOpen(false);
                    }}
                    style={[
                      styles.row,
                      !selected && availableTone && !unavailable && styles.rowAvailable,
                      !selected && unavailable && styles.rowUnavailable,
                      selected && styles.rowSelected,
                    ]}
                    interactionStyles={{ base: "" }}
                  >
                    <Text
                      className={
                        selected
                          ? "text-base font-medium text-white"
                          : unavailable
                            ? "text-text-secondary text-base"
                            : "text-text-primary text-base"
                      }
                    >
                      {o.label}
                    </Text>
                  </TouchableBox>
                );
              })}
            </ScrollView>
            <TouchableBox
              onPress={() => setOpen(false)}
              style={styles.done}
              label="Done"
              interactionStyles={{ base: "" }}
            >
              <Text className="text-center text-base font-semibold text-white">Done</Text>
            </TouchableBox>
          </View>
        </View>
      </Modal>
    </Box>
  );
}

const styles = StyleSheet.create({
  trigger: {
    borderWidth: 1,
    borderColor: color("neutral.200"),
    borderRadius: 12,
    paddingHorizontal: 12,
    paddingVertical: 12,
    backgroundColor: color("neutral.50"),
  },
  overlay: {
    flex: 1,
    justifyContent: "flex-end",
    backgroundColor: "rgba(0,0,0,0.4)",
  },
  sheet: {
    backgroundColor: color("neutral.50"),
    borderTopLeftRadius: 16,
    borderTopRightRadius: 16,
    paddingHorizontal: 16,
    paddingTop: 16,
    paddingBottom: 24,
    maxHeight: "70%",
  },
  list: { maxHeight: 360 },
  row: {
    paddingVertical: 14,
    paddingHorizontal: 12,
    borderRadius: 10,
    marginBottom: 6,
    backgroundColor: color("neutral.100"),
  },
  rowAvailable: {
    backgroundColor: color("brand.secondary"),
    opacity: 0.22,
  },
  rowUnavailable: {
    opacity: 0.5,
    backgroundColor: color("neutral.200"),
  },
  rowSelected: {
    backgroundColor: color("brand.accent"),
    opacity: 1,
  },
  done: {
    marginTop: 12,
    backgroundColor: color("neutral.600"),
    paddingVertical: 12,
    borderRadius: 12,
    alignItems: "center",
  },
});
