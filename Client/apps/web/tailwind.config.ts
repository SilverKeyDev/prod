import {
  colors,
  spacing as spacingMap,
  breakpoints,
  fontFamily,
  fontSize,
} from "../../packages/design-tokens";

/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./app/**/*.{js,ts,jsx,tsx}",
    "./pages/**/*.{js,ts,jsx,tsx}",
    "./components/**/*.{js,ts,jsx,tsx}",
    "./features/**/*.{js,ts,jsx,tsx}",
  ],
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
        sidebar: "10",
      },
    },
  },
  plugins: [],
};
