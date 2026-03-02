import type { ReactNode } from "react";

export type BaseModalProps = {
  isOpen: boolean;
  onClose: () => void;
  title?: string;
  size?: "xs" | "sm" | "md" | "lg" | "xl" | "full";
  showCloseButton?: boolean;
  closeOnBackdropClick?: boolean;
  closeOnEscape?: boolean;
  className?: string;
  backdropClassName?: string;
  children: ReactNode;
  headerContent?: ReactNode;
  footerContent?: ReactNode;
  zIndex?: number;
  showHeaderBorder?: boolean;
  contentBackground?: "default" | "off-white";
};
