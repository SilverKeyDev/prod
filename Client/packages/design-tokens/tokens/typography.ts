/**
 * Typography scale (font size, line height, font family).
 */
export const fontFamily = {
  serif: ["Playfair Display", "serif"],
  sans: ["Inter", "sans-serif"],
} as const;

export const fontSize = {
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
} as const;
