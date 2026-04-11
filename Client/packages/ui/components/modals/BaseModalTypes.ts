import type { ReactNode } from "react";

/** BaseModal sets this on its portal root so document-level outside-click logic can ignore modal UI. */
export const SILVERKEY_MODAL_ROOT_DATA_ATTR = "data-silverkey-modal-root";

/** For `Element.closest()` — must match {@link SILVERKEY_MODAL_ROOT_DATA_ATTR}. */
export const SILVERKEY_MODAL_ROOT_SELECTOR = `[${SILVERKEY_MODAL_ROOT_DATA_ATTR}]`;

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
