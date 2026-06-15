import type { ReactNode } from "react";
import type { StyleProp, ViewStyle } from "react-native";

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
  /**
   * Web: replaces default header container padding (e.g. `"p-0"` for full-bleed header band).
   * When omitted, uses `p-3 sm:p-4 md:p-6`.
   */
  headerContainerClassName?: string;
  /** Native: merged into header container; use e.g. `{ paddingHorizontal: 0, paddingVertical: 0 }` for flush header. */
  headerContainerStyle?: StyleProp<ViewStyle>;
  /** Optional max width for the modal (e.g. "80vw", "1200px"). When set, modal will be centered. Default: "100vw" (full width) */
  maxWidth?: string;
};
