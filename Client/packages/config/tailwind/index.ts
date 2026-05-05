// Relative path required: PostCSS/jiti loads this file in Node where "packages/design-tokens" alias is not resolved.
/* eslint-disable silverkey/no-relative-parent-imports -- Node context, no Vite alias */
import { createRequire } from "node:module";
import path from "node:path";
import { fileURLToPath } from "node:url";

import { breakpoints, fontFamily, fontSize, spacing as spacingMap } from "../../design-tokens";

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
      zIndex: {
        header: "100",
        sidebar: "200",
        dock: "300",
        /** Menus, selects, autocomplete, portaled popovers - above layout chrome and map markers (~1000) */
        dropdown: "5000",
        toast: "8000",
        overlay: "9000",
        modal: "10000",
        /** Full-screen hit target between z-modal and modal-popover so stray picks/double-clicks do not reach the modal backdrop */
        "modal-popover-underlay": "10015",
        /** Portaled pickers/menus opened from inside a modal (must sit above z-modal) */
        "modal-popover": "10020",
        /** Skip link when focused - above modals for keyboard escape hatch */
        skip: "10050",
      },
    },
  },
  plugins: [],
};

export default sharedTailwindPreset;
