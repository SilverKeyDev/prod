/**
 * CJS preset for Metro/Node (e.g. apps/mobile).
 * Keep in sync with index.ts and packages/design-tokens.
 * Web uses index.ts (ESM); mobile uses this file via require().
 */
const breakpoints = {
  xs: "475px",
  sm: "640px",
  md: "768px",
  lg: "1024px",
  xl: "1280px",
  "2xl": "1536px",
};

const colors = {
  brand: {
    primary: "hsl(210, 20%, 25%)",
    accent: "#A3B18A",
    secondary: "hsl(85, 15%, 55%)",
    tertiary: "hsl(45, 20%, 75%)",
  },
  brown: { DEFAULT: "#8C6F5A", light: "#8C6F5A", muted: "hsl(25, 18%, 45%)" },
  olive: { DEFAULT: "#A3B18A", light: "#97a77b", muted: "hsl(85, 15%, 55%)" },
  beige: { DEFAULT: "#D2C3A1", light: "#D2C3A1", muted: "hsl(45, 20%, 75%)" },
  gold: {
    DEFAULT: "#D2C3A1",
    light: "#D2C3A1",
    lighter: "hsl(45, 30%, 80%)",
    muted: "hsl(45, 20%, 70%)",
  },
  rose: {
    DEFAULT: "#F43F5E",
    light: "#FB7185",
    muted: "hsl(340, 20%, 55%)",
    50: "hsl(340, 20%, 95%)",
    100: "hsl(340, 20%, 90%)",
    800: "hsl(340, 20%, 25%)",
  },
  green: {
    DEFAULT: "#16a34a",
    light: "#22c55e",
    muted: "hsl(142, 20%, 50%)",
    50: "hsl(142, 20%, 95%)",
    100: "hsl(142, 20%, 90%)",
    200: "hsl(142, 20%, 85%)",
    500: "hsl(142, 20%, 50%)",
    600: "hsl(142, 20%, 40%)",
    700: "hsl(142, 20%, 35%)",
    800: "hsl(142, 20%, 25%)",
  },
  yellow: {
    DEFAULT: "#eab308",
    light: "#facc15",
    muted: "hsl(45, 20%, 60%)",
    50: "hsl(45, 20%, 95%)",
    100: "hsl(45, 20%, 90%)",
    700: "hsl(45, 20%, 40%)",
    800: "hsl(45, 20%, 30%)",
  },
  blue: {
    DEFAULT: "#2563eb",
    light: "#3b82f6",
    muted: "hsl(217, 20%, 50%)",
    50: "hsl(217, 20%, 95%)",
    100: "hsl(217, 20%, 90%)",
    500: "hsl(217, 20%, 50%)",
    600: "hsl(217, 20%, 40%)",
    800: "hsl(217, 20%, 25%)",
  },
  neutral: {
    50: "hsl(0, 0%, 98%)",
    100: "hsl(0, 0%, 96%)",
    200: "hsl(0, 0%, 90%)",
    300: "hsl(0, 0%, 83%)",
    400: "hsl(0, 0%, 64%)",
    500: "hsl(0, 0%, 45%)",
    600: "hsl(0, 0%, 32%)",
    700: "hsl(0, 0%, 25%)",
    800: "hsl(0, 0%, 15%)",
    900: "hsl(0, 0%, 9%)",
  },
  "off-white": "#FAF9F6",
  "off-white-gray": "hsl(0, 0%, 96%)",
  navy: "#1A1F36",
  "dark-green": "#405541",
  "gray-brown": "#B8B3AB",
  external: {
    google: { blue: "#4285F4", green: "#34A853", yellow: "#FBBC05", red: "#EA4335" },
  },
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
