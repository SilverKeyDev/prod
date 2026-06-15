import type { ReactNode } from "react";

export type BlurViewIntensity = "sm" | "md" | "lg" | "xl";

export type BlurViewTint = "light" | "dark" | "default";

export type BlurViewProps = {
  /** Blur intensity - maps to backdrop-blur-* on web, intensity 0-100 on native */
  intensity?: BlurViewIntensity;
  /** Blur tint (native only; affects overlay color) */
  tint?: BlurViewTint;
  /** Additional className */
  className?: string;
  /** Child content */
  children?: ReactNode;
};
