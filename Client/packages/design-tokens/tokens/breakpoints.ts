/**
 * Breakpoint (screen) tokens.
 * Consumers should use breakpoint() helper or Tailwind screen classes.
 */
export const breakpoints = {
  xs: "475px",
  sm: "640px",
  md: "768px",
  lg: "1024px",
  xl: "1280px",
  "2xl": "1536px",
} as const;

export type BreakpointName = keyof typeof breakpoints;
