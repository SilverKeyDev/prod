import React from "react";

import { Modal, Pressable, View } from "react-native";

import { useLocalization } from "packages/contexts";
import { Box } from "packages/ui/components/primitives";
import BodyText from "packages/ui/components/text/BodyText";
import Title from "packages/ui/components/text/Title";

import type { ConfirmationDialogProps } from "./ConfirmationDialog.types";

export default function ConfirmationDialog({
  isOpen,
  title,
  message,
  confirmText,
  cancelText,
  confirmIcon,
  onConfirm,
  onCancel,
}: ConfirmationDialogProps) {
  const { t } = useLocalization();
  if (!isOpen) return null;

  const resolvedConfirmText = confirmText ?? t("common.confirm");
  const resolvedCancelText = cancelText ?? t("common.cancel");

  return (
    <Modal transparent visible={isOpen} animationType="fade" onRequestClose={onCancel}>
      <View className="flex-1 items-center justify-center px-6">
        <Pressable
          className="bg-overlay-backdrop absolute inset-0"
          onPress={onCancel}
          accessibilityRole="button"
          accessibilityLabel="Dismiss dialog"
        />

        <View
          className="w-full max-w-sm rounded-2xl bg-white p-6"
          accessibilityViewIsModal
          accessibilityRole="alert"
          accessibilityLabel={title}
        >
          <Title size="sm" className="text-center">
            {title}
          </Title>
          <BodyText size="sm" muted className="mt-2 text-center">
            {message}
          </BodyText>

          <Box className="mt-6 flex-row gap-3">
            <Pressable
              onPress={onConfirm}
              className="bg-primary flex-1 flex-row items-center justify-center gap-2 rounded-xl px-4 py-3"
              accessibilityRole="button"
              accessibilityLabel={resolvedConfirmText}
            >
              {confirmIcon ? <View>{confirmIcon}</View> : null}
              <BodyText size="sm" className="font-semibold text-white">
                {resolvedConfirmText}
              </BodyText>
            </Pressable>

            <Pressable
              onPress={onCancel}
              className="border-border bg-background-surface flex-1 items-center justify-center rounded-xl border px-4 py-3"
              accessibilityRole="button"
              accessibilityLabel={resolvedCancelText}
            >
              <BodyText size="sm" className="text-text-primary font-semibold">
                {resolvedCancelText}
              </BodyText>
            </Pressable>
          </Box>
        </View>
      </View>
    </Modal>
  );
}
