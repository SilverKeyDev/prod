/**
 * Spacing scale and semantic tokens.
 * Consumers must use spacing() helper or Tailwind theme classes (e.g. p-2, gap-4).
 */
const _rem = (px: number) => `${px / 16}rem`;

export const spacingScale: Record<number, string> = {
  0: "0",
  0.5: "0.125rem",
  1: "0.25rem",
  /** Half-step: 6px — rem for user font-size scaling (touch padding uses `touch-*` px where needed). */
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
};

export const spacing = {
  ...spacingScale,
  "safe-top": "env(safe-area-inset-top)",
  "safe-bottom": "env(safe-area-inset-bottom)",
  "safe-left": "env(safe-area-inset-left)",
  "safe-right": "env(safe-area-inset-right)",
  "mobile-nav": "var(--mobile-bottom-reserved)",
  /** Literal px for consistent hit slop / WCAG touch targets (not font-scaled). */
  "touch-sm": "8px",
  "touch-md": "12px",
  "touch-lg": "16px",
  "touch-xl": "24px",
} as const;

/** ThemeContext-style spacing keys used for CSS variables */
export const themeSpacing = {
  xs: "0.25rem",
  sm: "0.5rem",
  md: "1rem",
  lg: "1.5rem",
  xl: "2rem",
} as const;
