import React from "react";

import { Modal, Pressable, StyleSheet, View } from "react-native";

import { color } from "packages/design-tokens";

type DialogProps = {
  open?: boolean;
  onClose?: () => void;
  "aria-label"?: string;
  children?: React.ReactNode;
};

/**
 * Native: RN Modal wrapper. Same open/onClose API as Headless UI Dialog.
 */
function DialogRoot({ open = false, onClose, children }: DialogProps) {
  return (
    <Modal visible={open} transparent onRequestClose={onClose ?? (() => {})}>
      <Pressable style={StyleSheet.absoluteFill} onPress={onClose} />
      <View style={styles.centered}>
        <Pressable onPress={(e) => e.stopPropagation()}>
          <View style={styles.panel}>{children}</View>
        </Pressable>
      </View>
    </Modal>
  );
}

function DialogPanel({ children }: { children?: React.ReactNode }) {
  return <>{children}</>;
}

function DialogTitle({ children }: { children?: React.ReactNode }) {
  return <>{children}</>;
}

function DialogDescription({ children }: { children?: React.ReactNode }) {
  return <>{children}</>;
}

DialogRoot.Panel = DialogPanel;
DialogRoot.Title = DialogTitle;
DialogRoot.Description = DialogDescription;

export const Dialog = DialogRoot;

const styles = StyleSheet.create({
  centered: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    backgroundColor: color("neutral.900"),
  },
  panel: {
    backgroundColor: color("neutral.50"),
    borderRadius: 16,
    padding: 24,
    minWidth: 280,
    maxWidth: "90%",
  },
});
