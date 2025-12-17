export const emailColors = {
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
  gold: {
    DEFAULT: "#D4AF37",
    light: "#E5C158",
    muted: "hsl(43, 74%, 49%)",
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
};

export const tailwindConfig = {
  theme: {
    extend: {
      colors: emailColors,
    },
  },
};
