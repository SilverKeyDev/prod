import React from "react";

import { Modal, View } from "react-native";

import { Box } from "packages/ui/components/primitives";
import { Text } from "packages/ui/components/primitives";
import { Pressable } from "packages/ui/components/primitives/button";

import type { ConfirmationDialogProps } from "./ConfirmationDialog.types";

export default function ConfirmationDialog({
  isOpen,
  title,
  message,
  confirmText = "Confirm",
  cancelText = "Cancel",
  confirmIcon,
  onConfirm,
  onCancel,
}: ConfirmationDialogProps) {
  if (!isOpen) return null;

  return (
    <Modal transparent visible={isOpen} animationType="fade" onRequestClose={onCancel}>
      <View className="flex-1 items-center justify-center px-6">
        <Pressable className="absolute inset-0 bg-black/50" onPress={onCancel} />

        <Box className="w-full max-w-sm rounded-2xl bg-white p-6">
          <Text className="text-center text-lg font-semibold text-gray-900">{title}</Text>
          <Text className="mt-2 text-center text-sm text-gray-600">{message}</Text>

          <Box className="mt-6 flex-row gap-3">
            <Pressable
              onPress={onConfirm}
              className="bg-brand-accent flex-1 flex-row items-center justify-center gap-2 rounded-xl px-4 py-3"
            >
              {confirmIcon ? <Box>{confirmIcon}</Box> : null}
              <Text className="font-semibold text-white">{confirmText}</Text>
            </Pressable>

            <Pressable
              onPress={onCancel}
              className="flex-1 items-center justify-center rounded-xl border border-gray-300 bg-white px-4 py-3"
            >
              <Text className="font-semibold text-gray-900">{cancelText}</Text>
            </Pressable>
          </Box>
        </Box>
      </View>
    </Modal>
  );
}
