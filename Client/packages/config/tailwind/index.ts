// Relative path required: PostCSS/jiti loads this file in Node where "packages/design-tokens" alias is not resolved.
 
import { createRequire } from "node:module";
import path from "node:path";
import { fileURLToPath } from "node:url";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const require = createRequire(import.meta.url);
const foundation = require(
  path.resolve(__dirname, "../../design-tokens/tokens/color/foundation.json")
);
const features = require(path.resolve(__dirname, "../../design-tokens/tokens/color/features.json"));
const colors = { ...foundation, ...features };
const motionTheme = require(
  path.resolve(__dirname, "../../design-tokens/tokens/motion/motion.theme.json")
);
// Direct requires: PostCSS/jiti cannot resolve barrel re-exports from design-tokens/index.ts.
const { breakpoints } = require(
  path.resolve(__dirname, "../../design-tokens/tokens/layout/breakpoints.ts")
);
const { Z_LAYERS } = require(
  path.resolve(__dirname, "../../design-tokens/tokens/layout/zLayers.ts")
);
const fontSize = require(
  path.resolve(__dirname, "../../design-tokens/tokens/typography/fontSize.json")
);
const { fontFamily } = require(
  path.resolve(__dirname, "../../design-tokens/tokens/typography/fontFamily.ts")
);
const { spacing: spacingMap } = require(
  path.resolve(__dirname, "../../design-tokens/tokens/layout/spacing.ts")
);

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
      ...motionTheme,
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
        Object.entries(Z_LAYERS).map(([key, value]) => [key, String(value)])
      ),
    },
  },
  plugins: [],
};

export default sharedTailwindPreset;
