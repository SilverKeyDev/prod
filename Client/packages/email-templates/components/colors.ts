import { colors } from "packages/design-tokens";

const neutral = colors.neutral as Record<string, string>;

/** Email palette: subset of design-tokens colors for email templates. Uses new token names. */
export const emailColors = {
  primary: colors.primary as string,
  accent: colors.accent as string,
  destructive: colors.destructive as string,
  "text-primary": colors["text-primary"] as string,
  "text-secondary": colors["text-secondary"] as string,
  "background-surface": colors["background-surface"] as string,
  border: colors.border as string,
  /** Light divider (neutral.100) */
  "border-light": neutral["100"],
  /** Legacy brown for score badge; maps to warm accent. */
  brown: (colors as Record<string, unknown>).brown as { DEFAULT: string },
  neutral,
};

export const tailwindConfig = {
  theme: {
    extend: {
      colors: emailColors,
    },
  },
};
