"use strict";

/**
 * High-signal CSS lint only (no stylelint-config-standard — Tailwind theme(), Google Maps
 * overrides, and vendor resets do not satisfy “standard” rules).
 * @type {import('stylelint').Config}
 */
module.exports = {
  extends: [],
  ignoreFiles: [
    "**/node_modules/**",
    "**/dist/**",
    "**/coverage/**",
    "**/tailwind-output.css",
    "**/debug-metro-tailwind.css",
  ],
  plugins: ["./plugins/no-html-body-overflow-x-hidden.cjs"],
  rules: {
    "at-rule-no-unknown": [
      true,
      {
        ignoreAtRules: [
          "tailwind",
          "apply",
          "layer",
          "screen",
          "variants",
          "responsive",
          "reference",
          "theme",
          "config",
          "plugin",
        ],
      },
    ],
    "declaration-property-value-disallowed-list": [
      {
        "/^(height|min-height|max-height|width|min-width|max-width|block-size|inline-size)/": [
          /[\s()]100vh\b/,
        ],
      },
      {
        message: () =>
          "Use dynamic viewport units (e.g. 100dvh, 100svh, 100lvh) instead of 100vh — 100vh is often wrong on mobile browsers.",
      },
    ],
    "declaration-property-unit-allowed-list": {
      "/^padding|^margin|^(row-|column-)?gap$/": [
        "em",
        "rem",
        "%",
        "fr",
        "ch",
        "ex",
        "vh",
        "vw",
        "dvh",
        "dvw",
        "svh",
        "lvh",
        "vmin",
        "vmax",
      ],
    },
    "silverkey/no-html-body-overflow-x-hidden": true,
  },
};
