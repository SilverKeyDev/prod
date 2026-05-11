/**
 * Typography scale (font size, line height, font family).
 * Font size entries are shared with the Tailwind preset via fontSize.json (single source of truth).
 */
import fontSizeJson from "./fontSize.json";

export const fontFamily = {
  serif: ["Playfair Display", "serif"],
  sans: ["Inter", "sans-serif"],
} as const;

export const fontSize = fontSizeJson as typeof fontSizeJson;
