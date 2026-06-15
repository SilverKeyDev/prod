import React, { useEffect } from "react";

import { Modal, Pressable, StyleSheet, View } from "react-native";

import { color } from "packages/design-tokens";
import { ScrollView, Text } from "packages/ui/components/structure/primitives";

import type { CoverProps } from "./CoverTypes";

const Cover: React.FC<CoverProps> = (props) => {
  const {
    isOpen,
    onClose,
    title,
    showCloseButton = true,
    children,
    headerContent,
    footerContent,
    showHeaderBorder = true,
    headerContainerStyle,
  } = props;

  useEffect(() => {
    if (!isOpen) return;
    return () => {};
  }, [isOpen]);

  if (!isOpen) return null;

  return (
    <Modal
      visible={isOpen}
      transparent={false}
      animationType="slide"
      onRequestClose={onClose}
      statusBarTranslucent
    >
      <View style={styles.container}>
        {(title ?? headerContent ?? showCloseButton) && (
          <View
            style={[styles.header, showHeaderBorder && styles.headerBorder, headerContainerStyle]}
          >
            <View style={styles.headerContent}>
              {headerContent ?? (title ? <Text style={styles.title}>{title}</Text> : null)}
            </View>
            {showCloseButton && (
              <Pressable onPress={onClose} style={styles.closeButton} accessibilityLabel="Close">
                <Text style={styles.closeText}>×</Text>
              </Pressable>
            )}
          </View>
        )}
        <ScrollView
          style={styles.scroll}
          contentContainerStyle={styles.scrollContent}
          keyboardShouldPersistTaps="handled"
        >
          {children}
        </ScrollView>
        {footerContent && <View style={styles.footer}>{footerContent}</View>}
      </View>
    </Modal>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: color("neutral.50"),
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
  scroll: {
    flex: 1,
  },
  scrollContent: {
    padding: 16,
  },
  footer: {
    padding: 16,
    borderTopWidth: 1,
    borderTopColor: color("neutral.200"),
  },
});

export default Cover;
export type { CoverProps } from "./CoverTypes";
