import type { ReactNode } from "react";

export type UniversalGradientVariant = "accent-header" | "overlay-dark" | "overlay-dark-bottom";

export type UniversalGradientProps = {
  /** Gradient variant - maps to design tokens */
  variant: UniversalGradientVariant;
  /** Additional className */
  className?: string;
  /** Child content */
  children?: ReactNode;
};
