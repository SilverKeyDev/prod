import React, { useEffect } from "react";

import { Modal, Pressable, StyleSheet, View } from "react-native";

import { color } from "packages/design-tokens";
import CloseButton from "packages/ui/components/actions/button/core/CloseButton";
import ScrollView from "packages/ui/components/structure/primitives/scroll/ScrollView";
import Title from "packages/ui/components/structure/text/Title";

import type { BaseModalProps } from "./BaseModalTypes";

const NATIVE_PANEL_HEIGHT = "85%";

const BaseModal: React.FC<BaseModalProps> = (props) => {
  const {
    isOpen,
    onClose,
    title,
    panelLayout = "auto",
    showCloseButton = true,
    closeOnBackdropClick = true,
    children,
    headerContent,
    footerContent,
    showHeaderBorder = true,
  } = props;

  const fixedPanel = panelLayout === "fixed";

  useEffect(() => {
    if (!isOpen) return;
    return () => {};
  }, [isOpen]);

  if (!isOpen) return null;

  const modalLabel = title ?? "Dialog";

  return (
    <Modal
      visible={isOpen}
      transparent
      animationType="fade"
      onRequestClose={onClose}
      statusBarTranslucent
      accessibilityViewIsModal
    >
      <Pressable
        style={styles.backdrop}
        onPress={closeOnBackdropClick ? onClose : undefined}
        accessibilityRole="none"
        importantForAccessibility="no-hide-descendants"
      >
        <Pressable style={styles.centered} onPress={(e) => e.stopPropagation()}>
          <View
            style={[styles.panel, fixedPanel && styles.panelFixed]}
            accessibilityViewIsModal
            accessibilityLabel={modalLabel}
            accessibilityRole="none"
          >
            {(title ?? headerContent ?? showCloseButton) && (
              <View style={[styles.header, showHeaderBorder && styles.headerBorder]}>
                <View style={styles.headerContent}>
                  {headerContent ??
                    (title ? (
                      <Title
                        as="h2"
                        size="sm"
                        className="text-text-primary font-sans font-medium leading-snug"
                      >
                        {title}
                      </Title>
                    ) : null)}
                </View>
                {showCloseButton && (
                  <CloseButton variant="ghost" size="sm" onClick={onClose} label="Close modal" />
                )}
              </View>
            )}
            {fixedPanel ? (
              <ScrollView
                style={styles.bodyFixed}
                contentContainerStyle={styles.bodyContent}
                keyboardShouldPersistTaps="handled"
              >
                {children}
              </ScrollView>
            ) : (
              <View style={styles.body}>{children}</View>
            )}
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
    width: "100%",
    flexDirection: "column",
  },
  panelFixed: {
    height: NATIVE_PANEL_HEIGHT,
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
  body: {
    padding: 16,
    maxHeight: 400,
  },
  bodyFixed: {
    flex: 1,
    minHeight: 0,
  },
  bodyContent: {
    padding: 16,
  },
  footer: {
    padding: 16,
    borderTopWidth: 1,
    borderTopColor: color("neutral.200"),
  },
});

export default BaseModal;
