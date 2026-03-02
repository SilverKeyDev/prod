// Relative path required: PostCSS/jiti loads this file in Node where "packages/design-tokens" alias is not resolved.
/* eslint-disable silverkey/no-relative-parent-imports -- Node context, no Vite alias */
import {
  breakpoints,
  colors,
  fontFamily,
  fontSize,
  spacing as spacingMap,
} from "../../design-tokens";

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
      zIndex: {
        modal: "50",
        overlay: "40",
        dropdown: "30",
        header: "20",
        /** Above main content (e.g. search map/reels z-10) so nav stays clickable when on full-height routes. */
        sidebar: "25",
      },
    },
  },
  plugins: [],
};

export default sharedTailwindPreset;
