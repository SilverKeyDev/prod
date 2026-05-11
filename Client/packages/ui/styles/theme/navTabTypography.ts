/**
 * Tailwind class recipes for nav rows and button label hover — composition layer, not atomic tokens.
 * Keep literals whole (no runtime concatenation) so Tailwind JIT emits them.
 */

/** Dark chrome + mobile dock: default row label vs selected. */
export const tailwindNavChromeNavText = {
  inactive: "!font-medium !text-responsive-sm",
  highlighted: "!font-semibold !text-responsive-sm",
} as const;

/**
 * Underline tab rows at sm / md / lg density. Uses direct Tailwind text-* utilities
 * with `!` important so it always wins over the Button label's default `text-sm`.
 * Whole-literal strings (no concatenation) keep Tailwind JIT happy.
 */
export const navRowTypography = {
  sm: {
    inactive: "!font-medium !text-xs md:!text-sm",
    highlighted: "!font-semibold !text-xs md:!text-sm",
  },
  md: {
    inactive: "!font-medium !text-xs sm:!text-sm md:!text-base",
    highlighted: "!font-semibold !text-xs sm:!text-sm md:!text-base",
  },
  lg: {
    inactive: "!font-medium !text-sm sm:!text-base md:!text-lg",
    highlighted: "!font-semibold !text-sm sm:!text-base md:!text-lg",
  },
} as const;

export type NavRowTypographySize = keyof typeof navRowTypography;

/**
 * Button label on hover (use with `group` on the control): slightly heavier weight only, same
 * size as default label — aligned with {@link navRowTypography}. Literal strings for Tailwind JIT.
 */
export const tailwindButtonLabelHoverTypography = {
  sm: "group-hover:!font-semibold",
  md: "group-hover:!font-semibold",
  lg: "group-hover:!font-semibold",
} as const;
