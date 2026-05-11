import containerQueries from "@tailwindcss/container-queries";

import sharedTailwindPreset from "../../packages/config/tailwind";

/** @type {import('tailwindcss').Config} */
export default {
  presets: [sharedTailwindPreset],
  plugins: [containerQueries],
  content: [
    "./index.html",
    "./app/**/*.{js,ts,jsx,tsx}",
    "./pages/**/*.{js,ts,jsx,tsx}",
    "./components/**/*.{js,ts,jsx,tsx}",
    "./features/**/*.{js,ts,jsx,tsx}",
    // Packages: UI and features are imported by the app; Tailwind must scan them to generate classes
    "../../packages/ui/**/*.{js,ts,jsx,tsx}",
    "../../packages/features/**/*.{js,ts,jsx,tsx}",
    "../../packages/contexts/**/*.{js,ts,jsx,tsx}",
    "../../packages/email-templates/**/*.{js,ts,jsx,tsx}",
    "../../packages/design-tokens/**/*.{js,ts,jsx,tsx}",
  ],
};
