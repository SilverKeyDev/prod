import { colors } from "../../design-tokens";

/** Email palette: subset of design-tokens colors for email templates. */
export const emailColors = {
  brown: colors.brown,
  olive: colors.olive,
  gold: colors.gold,
  neutral: colors.neutral,
};

export const tailwindConfig = {
  theme: {
    extend: {
      colors: emailColors,
    },
  },
};
