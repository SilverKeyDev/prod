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
  onShareAgreement?: () => void;
  isAgent: boolean;
};

export function MessagingAttachmentMenu({
  visible,
  onClose,
  onShareHome,
  onShareDocument,
  onCalendarEvent,
  onShareAgreement,
  isAgent,
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
            <Text className="text-left text-base font-medium text-text-primary">Share home</Text>
          </RNPressable>
          <RNPressable
            onPress={() => {
              onClose();
              onShareDocument();
            }}
            style={styles.option}
          >
            <Text className="text-left text-base font-medium text-text-primary">Share document</Text>
          </RNPressable>
          <RNPressable
            onPress={() => {
              onClose();
              onCalendarEvent();
            }}
            style={styles.option}
          >
            <Text className="text-left text-base font-medium text-text-primary">Calendar event</Text>
          </RNPressable>
          {isAgent && onShareAgreement && (
            <RNPressable
              onPress={() => {
                onClose();
                onShareAgreement();
              }}
              style={styles.option}
            >
              <Text className="text-left text-base font-medium text-text-primary">Share agreement</Text>
            </RNPressable>
          )}
          <RNPressable onPress={onClose} style={[styles.option, styles.cancel]}>
            <Text className="text-left text-base font-medium text-text-secondary">Cancel</Text>
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
