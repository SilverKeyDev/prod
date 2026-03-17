import React from "react";

import { Modal, Pressable, StyleSheet, View } from "react-native";

import { color } from "packages/design-tokens";
import { Text } from "packages/ui/components/primitives";

type Agreement = { title?: string };

type SelectAgreementModalNativeProps = {
  isOpen: boolean;
  onClose: () => void;
  onSelect: (agreement: Agreement) => void;
  clientId?: string;
};

export default function SelectAgreementModalNative({
  isOpen,
  onClose,
  onSelect,
  clientId: _clientId,
}: SelectAgreementModalNativeProps) {
  if (!isOpen) return null;

  return (
    <Modal visible={isOpen} transparent animationType="slide">
      <View style={styles.backdrop}>
        <View style={styles.sheet}>
          <View style={styles.header}>
            <Text className="text-text-primary text-lg font-semibold">Select Agreement</Text>
            <Pressable onPress={onClose} hitSlop={12}>
              <Text className="text-text-secondary text-base font-medium">Close</Text>
            </Pressable>
          </View>
          <Text className="text-text-secondary px-4 py-2 text-sm">
            Agreement selection is currently managed in the Documents experience.
          </Text>
          <View style={styles.footer}>
            <Pressable
              onPress={() => {
                onSelect({ title: "Agreement" });
                onClose();
              }}
              style={styles.shareButton}
            >
              <Text className="font-semibold text-white">Share placeholder</Text>
            </Pressable>
          </View>
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
  footer: {
    paddingHorizontal: 16,
    paddingTop: 16,
  },
  shareButton: {
    backgroundColor: color("brand.accent"),
    paddingVertical: 12,
    borderRadius: 12,
    alignItems: "center",
  },
});
