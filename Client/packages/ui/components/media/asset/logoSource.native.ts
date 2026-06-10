/**
 * React Native image references used across the app.
 * These map the same logical identifiers used on web to native-friendly
 * sources (e.g. `require()`d assets or remote URIs).
 */

import { DEFAULT_AVATAR_WEB_PATH } from "packages/utils/product/media/defaultAvatar";

export { DEFAULT_AVATAR_WEB_PATH };

// Metro will bundle these static assets; path is relative to Client root.
// Keep these in sync with the URLs used on web so the same images appear
// across platforms.
/* eslint-disable @typescript-eslint/no-require-imports -- RN/Metro static asset resolution requires require() */
const logoSource = require("../../../../public/logo.png");
const miniLogoSource = require("../../../../public/minilogo.png");
const defaultAvatarSource = require("../../../../public/default-avatar.png");

// Google-provided "Sign in with Google" button assets for native platforms.
// We use high-resolution neutral rounded sign-in buttons for iOS and Android.
const googleSignInAndroidSource = require("../../../../public/signin-assets/Android/png@4x/neutral/android_neutral_rd_SI@4x.png");
const googleSignInIosSource = require("../../../../public/signin-assets/iOS/png@4x/neutral/ios_neutral_rd_SI@4x.png");
/* eslint-enable @typescript-eslint/no-require-imports */

/** Full SilverKey wordmark logo (horizontal). */
export const LOGO_SOURCE = logoSource;

/** Compact mark used for favicon and small placements. */
export const MINI_LOGO_SOURCE = miniLogoSource;

/** Default profile silhouette (PNG export of web `default-avatar.svg`). */
export const DEFAULT_AVATAR_BUNDLED: number = defaultAvatarSource;

/** Google "Sign in with Google" button asset for Android. */
export const GOOGLE_SIGN_IN_ANDROID_SOURCE = googleSignInAndroidSource;

/** Google "Sign in with Google" button asset for iOS. */
export const GOOGLE_SIGN_IN_IOS_SOURCE = googleSignInIosSource;
