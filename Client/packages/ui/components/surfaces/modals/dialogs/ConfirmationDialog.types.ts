import type React from "react";

/**
 * Shared props for ConfirmationDialog across web and native.
 * Web/native implementations extend or use these as needed.
 */
export type ConfirmationDialogProps = {
  isOpen: boolean;
  title: string;
  message: string;
  confirmText?: string;
  cancelText?: string;
  /** Icon for confirm button (e.g. LogOut for logout confirmation) */
  confirmIcon?: React.ReactNode;
  onConfirm: () => void;
  onCancel: () => void;
};
