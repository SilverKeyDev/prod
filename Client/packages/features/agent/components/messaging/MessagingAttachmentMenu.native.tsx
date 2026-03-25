import React from "react";

import { Modal, Pressable as RNPressable, StyleSheet, View } from "react-native";

import { color } from "packages/design-tokens";
import { Text } from "packages/ui/components/primitives";

type MessagingAttachmentMenuProps = {
  visible: boolean;
  onClose: () => void;
  onShareHome: () => void;
  onShareDocument: () => void;
  onCalendarEvent: () => void;
};

export function MessagingAttachmentMenu({
  visible,
  onClose,
  onShareHome,
  onShareDocument,
  onCalendarEvent,
}: MessagingAttachmentMenuProps) {
  return (
    <Modal visible={visible} transparent animationType="fade" onRequestClose={onClose}>
      <RNPressable style={styles.backdrop} onPress={onClose}>
        <View style={styles.sheet}>
          <RNPressable
            onPress={() => {
              onClose();
              onShareHome();
            }}
            style={styles.option}
          >
            <Text className="text-text-primary text-left text-base font-medium">Share home</Text>
          </RNPressable>
          <RNPressable
            onPress={() => {
              onClose();
              onShareDocument();
            }}
            style={styles.option}
          >
            <Text className="text-text-primary text-left text-base font-medium">
              Share document
            </Text>
          </RNPressable>
          <RNPressable
            onPress={() => {
              onClose();
              onCalendarEvent();
            }}
            style={styles.option}
          >
            <Text className="text-text-primary text-left text-base font-medium">
              Calendar event
            </Text>
          </RNPressable>
          <RNPressable onPress={onClose} style={[styles.option, styles.cancel]}>
            <Text className="text-text-secondary text-left text-base font-medium">Cancel</Text>
          </RNPressable>
        </View>
      </RNPressable>
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
    paddingBottom: 24,
    paddingHorizontal: 16,
    paddingTop: 8,
  },
  option: {
    alignItems: "flex-start",
    paddingVertical: 16,
    paddingHorizontal: 8,
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: color("neutral.200"),
  },
  cancel: {
    borderBottomWidth: 0,
    marginTop: 8,
  },
});
