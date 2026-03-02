/**
 * PostCSS config for apps/mobile so any pipeline that parses global.css
 * (e.g. NativeWind/Metro) recognizes @tailwind and does not emit "Unknown at rule" warnings.
 */
/* eslint-env node */
/* global module */
module.exports = {
  plugins: {
    tailwindcss: {},
  },
};
