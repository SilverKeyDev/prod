/**
 * Shared UniversalGradient variant styles - single source of truth for web and native.
 * Platform files must import from here per require-shared-platform-styles.
 *
 * Web-only gradient classes below; native uses UNIVERSAL_GRADIENT_VARIANT_CONFIG (expo-linear-gradient).
 */
import { color } from "packages/design-tokens";

import type { UniversalGradientVariant } from "./types";

/** Web: Tailwind gradient classes per variant. Used by UniversalGradient.web.tsx; native uses UNIVERSAL_GRADIENT_VARIANT_CONFIG (expo-linear-gradient). */
export const UNIVERSAL_GRADIENT_VARIANT_CLASSES: Record<
  UniversalGradientVariant,
  string
> = {
  "accent-header": "bg-gradient-to-r from-accent-header to-accent-header",
  "overlay-dark": "bg-gradient-to-t from-neutral-900 to-transparent",
  "overlay-dark-bottom": "bg-gradient-to-t from-neutral-900 to-transparent",
};

/** Native: expo-linear-gradient colors and direction per variant */
export const UNIVERSAL_GRADIENT_VARIANT_CONFIG: Record<
  UniversalGradientVariant,
  {
    colors: string[];
    start: { x: number; y: number };
    end: { x: number; y: number };
  }
> = {
  "accent-header": {
    colors: [color("accent-header"), "rgba(210, 195, 161, 0.9)"],
    start: { x: 0, y: 0.5 },
    end: { x: 1, y: 0.5 },
  },
  "overlay-dark": {
    colors: ["rgba(0,0,0,0.6)", "transparent"],
    start: { x: 0.5, y: 1 },
    end: { x: 0.5, y: 0 },
  },
  "overlay-dark-bottom": {
    colors: ["rgba(0,0,0,0.6)", "transparent"],
    start: { x: 0.5, y: 1 },
    end: { x: 0.5, y: 0 },
  },
};
