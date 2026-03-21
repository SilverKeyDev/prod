import type { ReactNode } from "react";

export type CoverAnimation = "none" | "slideFromRight" | "slideFromLeft";

export type CoverProps = {
  isOpen: boolean;
  onClose: () => void;
  children: ReactNode;
  /** Optional header: same API as BaseModal */
  title?: string;
  headerContent?: ReactNode;
  showCloseButton?: boolean;
  showHeaderBorder?: boolean;
  footerContent?: ReactNode;
  zIndex?: number;
  closeOnEscape?: boolean;
  /** Enter/exit animation. Default "none". */
  animation?: CoverAnimation;
  className?: string;
};
