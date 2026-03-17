/**
 * BlurView style constants — single source of truth for web and native.
 * Platform files must import from here per require-shared-platform-styles.
 *
 * Native: Numeric intensity map for expo-blur API (this file).
 * Web: CSS backdrop-blur classes in blurViewVariants.web.ts.
 */

export type BlurViewIntensity = "sm" | "md" | "lg" | "xl";

/** Native: expo-blur intensity values (0–100) for each intensity */
export const BLUR_INTENSITY_MAP: Record<BlurViewIntensity, number> = {
  sm: 20,
  md: 40,
  lg: 60,
  xl: 80,
};
