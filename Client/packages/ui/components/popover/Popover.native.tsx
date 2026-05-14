import React from "react";

import { Modal } from "react-native";

import { Box, Pressable, ScrollView } from "packages/ui/components/primitives";

import type { PopoverProps } from "./Popover.types";
import { usePopoverState } from "./usePopoverState";

/**
 * Native: Modal-based popover. Trigger opens modal; panel content in modal.
 * Closes on backdrop press or when onClose is called.
 */
export default function Popover({
  trigger,
  children,
  open: controlledOpen,
  onOpenChange,
  panelMaxHeight,
  className = "",
  triggerWrapperClassName = "",
}: PopoverProps): React.ReactElement {
  const { open, onToggle, onClose } = usePopoverState(controlledOpen, onOpenChange);

  const maxHeight = panelMaxHeight
    ? parseInt(String(panelMaxHeight).replace(/\D/g, ""), 10) || 400
    : 400;
  const panelContent = open ? (
    <Box
      className="border-border bg-background-surface min-w-72 max-w-full rounded-2xl border p-6"
      style={{ maxHeight }}
    >
      <ScrollView
        className="max-h-80"
        contentContainerStyle={{ paddingVertical: 4 }}
        keyboardShouldPersistTaps="handled"
        bounces={false}
      >
        {children({
          onClose,
          registerOutsideClickSafeTarget: () => () => {
            /* no-op on native */
          },
        })}
      </ScrollView>
    </Box>
  ) : null;

  return (
    <Box className={`relative ${className}`.trim()}>
      <Box className={triggerWrapperClassName || undefined}>{trigger({ open, onToggle })}</Box>
      <Modal visible={open} transparent animationType="fade" onRequestClose={onClose}>
        <Pressable className="bg-overlay-backdrop absolute inset-0" onPress={onClose} />
        <Box className="flex-1 items-center justify-end px-4 pb-6">
          <Pressable onPress={(e) => e.stopPropagation()}>{panelContent}</Pressable>
        </Box>
      </Modal>
    </Box>
  );
}
