/**
 * Web-only BlurView CSS classes (backdrop-blur).
 * Native uses expo-blur; import from blurViewVariants — bundler resolves to .web or base.
 */

import type { BlurViewIntensity } from "./blurViewVariants";

/** Web: Tailwind backdrop-blur classes for each intensity */
export const BLUR_INTENSITY_CLASSES: Record<BlurViewIntensity, string> = {
  sm: "backdrop-blur-sm",
  md: "backdrop-blur-md",
  lg: "backdrop-blur-lg",
  xl: "backdrop-blur-xl",
};
