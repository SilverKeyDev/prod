/* eslint-disable @typescript-eslint/no-require-imports -- Tailwind/Metro use CJS */
const path = require("node:path");

/** @type {import('tailwindcss').Config} */
module.exports = {
  presets: [
    require("nativewind/preset"),
    require(path.resolve(__dirname, "../../packages/config/tailwind/preset.cjs.js")),
  ],
  content: [
    "./App.{js,jsx,ts,tsx}",
    "./app/**/*.{js,jsx,ts,tsx}",
    "./components/**/*.{js,jsx,ts,tsx}",
    path.resolve(__dirname, "../../packages/ui/**/*.{js,jsx,ts,tsx}"),
    path.resolve(__dirname, "../../packages/features/**/*.{js,jsx,ts,tsx}"),
    path.resolve(__dirname, "../../packages/contexts/**/*.{js,jsx,ts,tsx}"),
  ],
  plugins: [],
};
