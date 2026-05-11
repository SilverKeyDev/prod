/**
 * CJS preset for Metro/Node (e.g. apps/mobile).
 * Colors: merge foundation (system) + features (domain-specific) JSON.
 * Font sizes: packages/design-tokens/tokens/typography/fontSize.json (shared with typography/index.ts).
 */

const path = require("node:path");

const foundation = require(
  path.resolve(__dirname, "../../design-tokens/tokens/color/foundation.json")
);
const features = require(path.resolve(__dirname, "../../design-tokens/tokens/color/features.json"));
const colors = { ...foundation, ...features };

const fontSize = require(
  path.resolve(__dirname, "../../design-tokens/tokens/typography/fontSize.json")
);

const motionTheme = require(
  path.resolve(__dirname, "../../design-tokens/tokens/motion/motion.theme.json")
);

const breakpoints = {
  xs: "475px",
  sm: "640px",
  md: "768px",
  lg: "1024px",
  xl: "1280px",
  "2xl": "1536px",
};

const fontFamily = {
  serif: ["Playfair Display", "serif"],
  sans: ["Inter", "sans-serif"],
};

const spacingMap = {
  0: "0",
  0.5: "0.125rem",
  1: "0.25rem",
  1.5: "0.375rem",
  2: "0.5rem",
  2.5: "0.625rem",
  3: "0.75rem",
  4: "1rem",
  4.5: "1.125rem",
  5: "1.25rem",
  6: "1.5rem",
  8: "2rem",
  10: "2.5rem",
  12: "3rem",
  16: "4rem",
  20: "5rem",
  24: "6rem",
  32: "8rem",
  40: "10rem",
  48: "12rem",
  64: "16rem",
  80: "20rem",
  96: "24rem",
  "safe-top": "env(safe-area-inset-top)",
  "safe-bottom": "env(safe-area-inset-bottom)",
  "safe-left": "env(safe-area-inset-left)",
  "safe-right": "env(safe-area-inset-right)",
  "mobile-nav": "var(--mobile-bottom-reserved)",
  "touch-sm": "8px",
  "touch-md": "12px",
  "touch-lg": "16px",
  "touch-xl": "24px",
};

/** @type {import('tailwindcss').Config} */
module.exports = {
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
        fadeIn: { "0%": { opacity: "0" }, "100%": { opacity: "1" } },
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
      minWidth: { touch: "44px", "touch-lg": "48px", button: "44px" },
      maxWidth: { mobile: "100vw", "touch-target": "44px" },
      aspectRatio: { "mobile-card": "16 / 9", "mobile-hero": "4 / 3" },
      // Stacking: base content < header < sidebar/dock < dropdowns < toasts < sheet overlays < modals < modal-popover-underlay < modal-popover < skip
      zIndex: {
        header: "100",
        sidebar: "200",
        dock: "300",
        /** Menus, selects, autocomplete, portaled popovers - above layout chrome and map markers (~1000) */
        dropdown: "5000",
        toast: "8000",
        /** Dimmed backdrops for sheets / nested overlays */
        overlay: "9000",
        /** Dialogs and full-screen modal stacks */
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
