/**
 * React Native image references used across the app.
 * These map the same logical identifiers used on web to native-friendly
 * sources (e.g. `require()`d assets or remote URIs).
 */

// Metro will bundle these static assets; path is relative to Client root.
// Keep these in sync with the URLs used on web so the same images appear
// across platforms.
/* eslint-disable @typescript-eslint/no-require-imports -- RN/Metro static asset resolution requires require() */
const logoSource = require("../../../../public/logo.png");
const miniLogoSource = require("../../../../public/minilogo.png");
/* eslint-enable @typescript-eslint/no-require-imports */

/** Full SilverKey wordmark logo (horizontal). */
export const LOGO_SOURCE = logoSource;

/** Compact mark used for favicon and small placements. */
export const MINI_LOGO_SOURCE = miniLogoSource;

/** Google \"G\" logo PNG (48px) for Google sign-in (remote URI). */
export const GOOGLE_ICON_URI =
  "https://upload.wikimedia.org/wikipedia/commons/thumb/2/2f/Google_2015_logo.svg/48px-Google_2015_logo.svg.png";
