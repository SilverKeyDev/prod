/**
 * Web image references used across the app.
 * These are logical identifiers so React Native can provide its own
 * platform-specific resolution in `logoSource.native.ts`.
 */

import { DEFAULT_AVATAR_WEB_PATH } from "packages/utils/media/defaultAvatar";

/** Public path to default profile silhouette (web); same art as bundled PNG on native. */
export { DEFAULT_AVATAR_WEB_PATH };

/**
 * Metro-bundled default avatar on native; on web use `source={{ uri: DEFAULT_AVATAR_WEB_PATH }}`.
 */
export const DEFAULT_AVATAR_BUNDLED: number | undefined = undefined;

/** Full SilverKey wordmark logo (horizontal). */
export const LOGO_URI = "/logo.png";

/** Compact mark used for favicon and small placements. */
export const MINI_LOGO_URI = "/minilogo.png";

/** Google \"G\" logo PNG (48px) for Google sign-in. */
export const GOOGLE_ICON_URI =
  "https://upload.wikimedia.org/wikipedia/commons/thumb/2/2f/Google_2015_logo.svg/48px-Google_2015_logo.svg.png";

/** Web: undefined (use SVG). Native: resolved via logoSource.native. */
export const GOOGLE_SIGN_IN_IOS_SOURCE: number | { uri: string } | undefined = undefined;

/** Web: undefined (use SVG). Native: resolved via logoSource.native. */
export const GOOGLE_SIGN_IN_ANDROID_SOURCE: number | { uri: string } | undefined = undefined;
