/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",                // include root html
    "./src/**/*.{js,ts,jsx,tsx}",  // scan all source files
  ],
  theme: {
    screens: {
      xs: "475px",
      sm: "640px",
      md: "768px",
      lg: "1024px",
      xl: "1280px",
      "2xl": "1536px",
    },
    extend: {
      colors: {
        // Muted Brand Colors with Low Saturation
        brand: {
          primary: 'hsl(210, 20%, 25%)',    // Muted navy
          accent: 'hsl(25, 18%, 45%)',      // Muted brown accent
          secondary: 'hsl(85, 15%, 55%)',   // Muted olive
          tertiary: 'hsl(45, 20%, 75%)',    // Muted beige
        },
        brown: {
          DEFAULT: "#8C6F5A",
          light: "#8C6F5A",
          muted: 'hsl(25, 18%, 45%)',       // Low saturation brown
        },
        olive: {
          DEFAULT: "#A3B18A",
          light: "#97a77b",
          muted: 'hsl(85, 15%, 55%)',       // Low saturation olive
        },
        beige: {
          DEFAULT: "#D2C3A1",
          light: "#D2C3A1",
          muted: 'hsl(45, 20%, 75%)',       // Low saturation beige
        },
        gold: {
          DEFAULT: "#D2C3A1",
          light: "#D2C3A1",
          muted: 'hsl(45, 20%, 70%)',       // Low saturation gold
        },
        // Muted Neutrals
        neutral: {
          50: 'hsl(0, 0%, 98%)',            // Off-white
          100: 'hsl(0, 0%, 96%)',           // Very light gray
          200: 'hsl(0, 0%, 90%)',           // Light gray
          300: 'hsl(0, 0%, 83%)',           // Medium-light gray
          400: 'hsl(0, 0%, 64%)',           // Medium gray
          500: 'hsl(0, 0%, 45%)',           // Dark gray
          600: 'hsl(0, 0%, 32%)',           // Darker gray
          700: 'hsl(0, 0%, 25%)',           // Very dark gray
          800: 'hsl(0, 0%, 15%)',           // Near black
          900: 'hsl(0, 0%, 9%)',            // Almost black
        },
        "off-white": "#FAF9F6",
        navy: "#1A1F36",
        "dark-green": "#405541",
        "gray-brown": "#B8B3AB",
      },
      fontFamily: {
        serif: ["Playfair Display", "serif"],
        sans: ["Inter", "sans-serif"],
      },
      fontSize: {
        xs: ["0.75rem", { lineHeight: "1rem" }],
        sm: ["0.875rem", { lineHeight: "1.25rem" }],
        base: ["1rem", { lineHeight: "1.5rem" }],
        lg: ["1.125rem", { lineHeight: "1.75rem" }],
        xl: ["1.25rem", { lineHeight: "1.75rem" }],
        "2xl": ["1.5rem", { lineHeight: "2rem" }],
        "3xl": ["1.875rem", { lineHeight: "2.25rem" }],
        "4xl": ["2.25rem", { lineHeight: "2.5rem" }],
        // Mobile-optimized sizes
        "mobile-xs": ["0.625rem", { lineHeight: "0.875rem" }],
        "mobile-sm": ["0.75rem", { lineHeight: "1rem" }],
        "mobile-base": ["0.875rem", { lineHeight: "1.25rem" }],
        "mobile-lg": ["1rem", { lineHeight: "1.5rem" }],
        // Custom half-size between sm and base for signup
        "signup-mid": ["0.8125rem", { lineHeight: "1.125rem" }],
      },
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
      spacing: {
        "safe-top": "env(safe-area-inset-top)",
        "safe-bottom": "env(safe-area-inset-bottom)",
        "safe-left": "env(safe-area-inset-left)",
        "safe-right": "env(safe-area-inset-right)",
        // Touch-friendly spacing
        "touch-sm": "8px",
        "touch-md": "12px",
        "touch-lg": "16px",
        "touch-xl": "24px",
        // Additional spacing sizes
        "1.5": "6px",
        "2.5": "10px",
        "4.5": "18px",
      },
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