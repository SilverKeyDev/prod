// Relative path required: PostCSS/jiti loads this file in Node where "packages/design-tokens" alias is not resolved.

import { createRequire } from "node:module";
import path from "node:path";
import { fileURLToPath } from "node:url";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const require = createRequire(import.meta.url);

const breakpoints = require(
  path.resolve(__dirname, "../../design-tokens/tokens/layout/breakpoints.json")
);
const Z_LAYERS = require(path.resolve(__dirname, "../../design-tokens/tokens/layout/zLayers.json"));
const spacingMap = require(
  path.resolve(__dirname, "../../design-tokens/tokens/layout/spacing.json")
);
const fontSize = require(
  path.resolve(__dirname, "../../design-tokens/tokens/typography/fontSize.json")
);
const fontFamily = { serif: ["Playfair Display", "serif"], sans: ["Inter", "sans-serif"] };
const foundation = require(
  path.resolve(__dirname, "../../design-tokens/tokens/color/foundation.json")
);
const features = require(path.resolve(__dirname, "../../design-tokens/tokens/color/features.json"));
const colors = { ...foundation, ...features };
const motionTheme = require(
  path.resolve(__dirname, "../../design-tokens/tokens/motion/motion.theme.json")
);

/**
 * Shared Tailwind preset for apps/web and apps/mobile.
 * Import from packages/config/tailwind and set presets: [sharedTailwindPreset].
 */
/** @type {import('tailwindcss').Config} */
const sharedTailwindPreset = {
  theme: {
    screens: breakpoints ?? {},
    extend: {
      colors,
      fontFamily: fontFamily ?? {},
      fontSize: fontSize ?? {},
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
      spacing: spacingMap ?? {},
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
      zIndex: Object.fromEntries(
        Object.entries(Z_LAYERS ?? {}).map(([key, value]) => [key, String(value)])
      ),
    },
  },
  plugins: [],
};

export default sharedTailwindPreset;
