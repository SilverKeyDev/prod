// Relative path required: PostCSS/jiti loads this file in Node where "packages/design-tokens" alias is not resolved.
/* eslint-disable silverkey/no-relative-parent-imports -- Node context, no Vite alias */
import { createRequire } from "node:module";
import path from "node:path";
import { fileURLToPath } from "node:url";

import { breakpoints, fontFamily, fontSize, spacingMap, Z_LAYERS } from "../../design-tokens";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const require = createRequire(import.meta.url);
const colors = require(path.resolve(__dirname, "../../design-tokens/tokens/colors.json"));

/**
 * Shared Tailwind preset for apps/web and apps/mobile.
 * Import from packages/config/tailwind and set presets: [sharedTailwindPreset].
 */
/** @type {import('tailwindcss').Config} */
const sharedTailwindPreset = {
  theme: {
    screens: breakpoints,
    extend: {
      colors,
      fontFamily,
      fontSize,
      animation: {
        "fade-in": "fadeIn 0.5s ease-out",
        "slide-up": "slideUp 0.3s ease-out",
        "touch-feedback": "touchFeedback 0.1s ease-out",
      },
      keyframes: {
        fadeIn: {
          "0%": { opacity: "0" },
          "100%": { opacity: "1" },
        },
        slideUp: {
          "0%": { transform: "translateY(10px)", opacity: "0" },
          "100%": { transform: "translateY(0)", opacity: "1" },
        },
        touchFeedback: {
          "0%": { transform: "scale(1)" },
          "50%": { transform: "scale(0.98)" },
          "100%": { transform: "scale(1)" },
        },
      },
      spacing: spacingMap,
      minHeight: {
        touch: "44px",
        "touch-lg": "48px",
        button: "44px",
        input: "44px",
      },
      minWidth: {
        touch: "44px",
        "touch-lg": "48px",
        button: "44px",
      },
      maxWidth: {
        mobile: "100vw",
        "touch-target": "44px",
      },
      aspectRatio: {
        "mobile-card": "16 / 9",
        "mobile-hero": "4 / 3",
      },
      // Derived from Z_LAYERS in packages/design-tokens — single source of truth.
      // Tailwind requires string values; native code imports Z_LAYERS directly for numbers.
      zIndex: Object.fromEntries(
        Object.entries(Z_LAYERS).map(([key, value]) => [key, String(value)]),
      ),
    },
  },
  plugins: [],
};

export default sharedTailwindPreset;
