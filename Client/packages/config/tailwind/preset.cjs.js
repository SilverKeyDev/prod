/**
 * CJS preset for Metro/Node (e.g. apps/mobile).
 * Colors from single source: packages/design-tokens/tokens/colors.json.
 * Web uses index.ts (ESM); mobile uses this file via require().
 */

const path = require("node:path");

const colors = require(path.resolve(__dirname, "../../design-tokens/tokens/colors.json"));

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

const fontSize = {
  xs: ["0.75rem", { lineHeight: "1rem" }],
  sm: ["0.875rem", { lineHeight: "1.25rem" }],
  base: ["1rem", { lineHeight: "1.5rem" }],
  lg: ["1.125rem", { lineHeight: "1.75rem" }],
  xl: ["1.25rem", { lineHeight: "1.75rem" }],
  "2xl": ["1.5rem", { lineHeight: "2rem" }],
  "3xl": ["1.875rem", { lineHeight: "2.25rem" }],
  "4xl": ["2.25rem", { lineHeight: "2.5rem" }],
  "mobile-xs": ["0.625rem", { lineHeight: "0.875rem" }],
  "mobile-sm": ["0.75rem", { lineHeight: "1rem" }],
  "mobile-base": ["0.875rem", { lineHeight: "1.25rem" }],
  "mobile-lg": ["1rem", { lineHeight: "1.5rem" }],
  "signup-mid": ["0.8125rem", { lineHeight: "1.125rem" }],
};

const spacingMap = {
  0: "0",
  0.5: "0.125rem",
  1: "0.25rem",
  1.5: "6px",
  2: "0.5rem",
  2.5: "10px",
  3: "0.75rem",
  4: "1rem",
  4.5: "18px",
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
      minHeight: { touch: "44px", "touch-lg": "48px", button: "44px", input: "44px" },
      minWidth: { touch: "44px", "touch-lg": "48px", button: "44px" },
      maxWidth: { mobile: "100vw", "touch-target": "44px" },
      aspectRatio: { "mobile-card": "16 / 9", "mobile-hero": "4 / 3" },
      zIndex: { modal: "50", overlay: "40", dropdown: "30", header: "20", sidebar: "25" },
    },
  },
  plugins: [],
};
