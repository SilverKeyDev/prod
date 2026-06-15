import React from "react";

import { Modal, Pressable, StyleSheet, View } from "react-native";

import { color } from "packages/design-tokens";
import { Text } from "packages/ui/components/structure/primitives";

import type { UseCalendarEventRequestFormParams } from "@/features/agent/hooks/data/calendar/useCalendarEventRequestForm";

import { CalendarEventRequestFormCore } from "./CalendarEventRequestFormCore.native";

export type CalendarEventRequestModalNativeProps = UseCalendarEventRequestFormParams & {
  isOpen: boolean;
};

export default function CalendarEventRequestModalNative({
  isOpen,
  onClose,
  onSuccess,
  sendCalendarEventMessage,
}: CalendarEventRequestModalNativeProps) {
  if (!isOpen) {
    return null;
  }

  return (
    <Modal visible={isOpen} transparent animationType="slide" onRequestClose={onClose}>
      <View style={styles.backdrop}>
        <View style={styles.sheet}>
          <View style={styles.header}>
            <Text className="text-text-primary text-lg font-semibold">Request Calendar Event</Text>
            <Pressable onPress={onClose} hitSlop={12}>
              <Text className="text-text-secondary text-base font-medium">Cancel</Text>
            </Pressable>
          </View>
          <CalendarEventRequestFormCore
            onClose={onClose}
            onSuccess={onSuccess}
            sendCalendarEventMessage={sendCalendarEventMessage}
          />
        </View>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  backdrop: {
    flex: 1,
    backgroundColor: "rgba(0,0,0,0.4)",
    justifyContent: "flex-end",
  },
  sheet: {
    backgroundColor: color("neutral.50"),
    borderTopLeftRadius: 16,
    borderTopRightRadius: 16,
    maxHeight: "90%",
    paddingBottom: 24,
  },
  header: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    paddingHorizontal: 16,
    paddingTop: 16,
    paddingBottom: 12,
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: color("neutral.200"),
  },
});
