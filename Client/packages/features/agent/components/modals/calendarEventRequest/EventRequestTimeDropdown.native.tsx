import React, { useMemo, useState } from "react";

import { Modal, StyleSheet, View } from "react-native";

import { color } from "packages/design-tokens";
import {
  Box,
  ScrollView,
  Text,
  TouchableBox,
} from "packages/ui/components/primitives";

import {
  buildTimeOptions,
  EVENT_REQUEST_TIME_STEP_MINUTES,
} from "./eventRequestScheduleOptions";

export type EventRequestTimeDropdownProps = {
  value: string;
  onChange: (value: string) => void;
};

export function EventRequestTimeDropdown({
  value,
  onChange,
}: EventRequestTimeDropdownProps) {
  const [open, setOpen] = useState(false);
  const options = useMemo(
    () => buildTimeOptions(EVENT_REQUEST_TIME_STEP_MINUTES),
    [],
  );
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
        <Text
          className={
            value
              ? "text-text-primary text-base"
              : "text-text-secondary text-base"
          }
        >
          {selectedLabel ?? "Select time"}
        </Text>
      </TouchableBox>
      <Modal
        visible={open}
        transparent
        animationType="fade"
        onRequestClose={() => setOpen(false)}
      >
        <View style={styles.overlay}>
          <TouchableBox
            style={StyleSheet.absoluteFillObject}
            onPress={() => setOpen(false)}
            label="Close"
            interactionStyles={{ base: "" }}
          />
          <View style={styles.sheet}>
            <Text className="text-text-primary mb-3 text-base font-semibold">
              Select time
            </Text>
            <ScrollView style={styles.list} keyboardShouldPersistTaps="handled">
              {options.map((o) => (
                <TouchableBox
                  key={o.value}
                  label={o.label}
                  onPress={() => {
                    onChange(o.value);
                    setOpen(false);
                  }}
                  style={[styles.row, value === o.value && styles.rowSelected]}
                  interactionStyles={{ base: "" }}
                >
                  <Text
                    className={
                      value === o.value
                        ? "text-base font-medium text-white"
                        : "text-text-primary text-base"
                    }
                  >
                    {o.label}
                  </Text>
                </TouchableBox>
              ))}
            </ScrollView>
            <TouchableBox
              onPress={() => setOpen(false)}
              style={styles.done}
              label="Done"
              interactionStyles={{ base: "" }}
            >
              <Text className="text-center text-base font-semibold text-white">
                Done
              </Text>
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
  rowSelected: {
    backgroundColor: color("brand.accent"),
  },
  done: {
    marginTop: 12,
    backgroundColor: color("neutral.600"),
    paddingVertical: 12,
    borderRadius: 12,
    alignItems: "center",
  },
});
