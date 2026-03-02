/* eslint-disable @typescript-eslint/no-require-imports -- Tailwind/Metro use CJS */
const path = require("node:path");

/** @type {import('tailwindcss').Config} */
const nativewindPreset = require("nativewind/preset");
const sharedPreset = require(path.resolve(
  __dirname,
  "../../packages/config/tailwind/preset.cjs.js"
));

const mobileTailwindConfig = {
  presets: [nativewindPreset, sharedPreset],
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

// eslint-disable-next-line no-console -- Tailwind runs in Node; console logging is required for debugging
console.info("[Tailwind] Mobile config loaded", {
  presetsCount: mobileTailwindConfig.presets.length,
  contentGlobs: mobileTailwindConfig.content,
});

module.exports = mobileTailwindConfig;
