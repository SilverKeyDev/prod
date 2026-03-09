import React, { useEffect } from "react";

import { Modal, Pressable, StyleSheet, View } from "react-native";

import { color } from "packages/design-tokens";
import { Text } from "packages/ui/components/primitives";

import type { BaseModalProps } from "./BaseModalTypes";

const BaseModal: React.FC<BaseModalProps> = (props) => {
  const {
    isOpen,
    onClose,
    title,
    showCloseButton = true,
    closeOnBackdropClick = true,
    children,
    headerContent,
    footerContent,
    showHeaderBorder = true,
  } = props;

  useEffect(() => {
    if (!isOpen) return;
    // Optional: back handler on Android
    return () => {};
  }, [isOpen]);

  if (!isOpen) return null;

  return (
    <Modal
      visible={isOpen}
      transparent
      animationType="fade"
      onRequestClose={onClose}
      statusBarTranslucent
    >
      <Pressable style={styles.backdrop} onPress={closeOnBackdropClick ? onClose : undefined}>
        <Pressable style={styles.centered} onPress={(e) => e.stopPropagation()}>
          <View style={styles.panel}>
            {(title ?? headerContent ?? showCloseButton) && (
              <View style={[styles.header, showHeaderBorder && styles.headerBorder]}>
                <View style={styles.headerContent}>
                  {headerContent ?? (title ? <Text style={styles.title}>{title}</Text> : null)}
                </View>
                {showCloseButton && (
                  <Pressable
                    onPress={onClose}
                    style={styles.closeButton}
                    accessibilityLabel="Close modal"
                  >
                    <Text style={styles.closeText}>×</Text>
                  </Pressable>
                )}
              </View>
            )}
            <View style={styles.body}>{children}</View>
            {footerContent && <View style={styles.footer}>{footerContent}</View>}
          </View>
        </Pressable>
      </Pressable>
    </Modal>
  );
};

const styles = StyleSheet.create({
  backdrop: {
    flex: 1,
    backgroundColor: "rgba(0,0,0,0.5)",
    justifyContent: "center",
    alignItems: "center",
    padding: 16,
  },
  centered: {
    maxWidth: "100%",
    maxHeight: "90%",
  },
  panel: {
    backgroundColor: color("neutral.50"),
    borderRadius: 12,
    overflow: "hidden",
    minWidth: 280,
    maxHeight: "90%",
  },
  header: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingHorizontal: 16,
    paddingVertical: 12,
  },
  headerBorder: {
    borderBottomWidth: 1,
    borderBottomColor: color("neutral.200"),
  },
  headerContent: {
    flex: 1,
    minWidth: 0,
  },
  title: {
    fontSize: 18,
    fontWeight: "600",
    color: color("neutral.900"),
  },
  closeButton: {
    padding: 4,
    marginLeft: 8,
  },
  closeText: {
    fontSize: 24,
    color: color("neutral.500"),
  },
  body: {
    padding: 16,
    maxHeight: 400,
  },
  footer: {
    padding: 16,
    borderTopWidth: 1,
    borderTopColor: color("neutral.200"),
  },
});

export default BaseModal;
