/**
 * Single source of truth for color tokens.
 * Literal hex/hsl values are allowed only in this file.
 * Consumers must use color() helper or Tailwind theme classes.
 */
export const colors = {
  brand: {
    primary: "hsl(210, 20%, 25%)",
    accent: "#A3B18A",
    secondary: "hsl(85, 15%, 55%)",
    tertiary: "hsl(45, 20%, 75%)",
  },
  brown: {
    DEFAULT: "#8C6F5A",
    light: "#8C6F5A",
    muted: "hsl(25, 18%, 45%)",
  },
  olive: {
    DEFAULT: "#A3B18A",
    light: "#97a77b",
    muted: "hsl(85, 15%, 55%)",
  },
  beige: {
    DEFAULT: "#D2C3A1",
    light: "#D2C3A1",
    muted: "hsl(45, 20%, 75%)",
  },
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
  /** Third-party brand colors (e.g. Google Sign-In); use color("external.google.blue") etc. */
  external: {
    google: {
      blue: "#4285F4",
      green: "#34A853",
      yellow: "#FBBC05",
      red: "#EA4335",
    },
  },
} as const;

export type ColorPath = keyof typeof colors | (string & Record<never, never>);
