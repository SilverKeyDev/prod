import tailwindcss from "tailwindcss";
import autoprefixer from "autoprefixer";

// Suppress PostCSS warnings in build environment
if (typeof console !== "undefined") {
  const originalWarn = console.warn;
  console.warn = function (...args) {
    const message = args.join(" ");

    if (message.includes("PostCSS plugin did not pass the `from` option to `postcss.parse`")) {
      return;
    }

    originalWarn.apply(console, args);
  };
}

export default {
  plugins: [tailwindcss(), autoprefixer()],
};
