/**
 * Shared placeholder image and video URLs for feed/reels when API is unavailable
 * or media is missing. Use getPlaceholderImage(i) / getPlaceholderVideo(i) for
 * variety in test data and fallbacks.
 */

import { DEFAULT_AVATAR_WEB_PATH } from "packages/utils/media/defaultAvatar";

export const PLACEHOLDER_IMAGES: readonly string[] = [
  "/placeholders/dummy-photo.svg",
  "/placeholders/placeholder-living.svg",
  "/placeholders/placeholder-kitchen.svg",
  "/placeholders/placeholder-exterior.svg",
  "/placeholders/placeholder-bedroom.svg",
  "/placeholders/placeholder-bathroom.svg",
  "/placeholders/placeholder-garden.svg",
] as const;

/** All use dummy-video.mp4 until you add placeholder-video-1.mp4, placeholder-video-2.mp4 to public/. */
export const PLACEHOLDER_VIDEOS: readonly string[] = [
  "/dummy-video.mp4",
  "/dummy-video.mp4",
  "/dummy-video.mp4",
] as const;

/** Default image when no index (e.g. single fallback). */
export const DEFAULT_PLACEHOLDER_IMAGE = PLACEHOLDER_IMAGES[0];

/**
 * Default profile picture when user has no avatar (Instagram-style gray silhouette).
 * Web: `public/default-avatar.svg`. Native: bundled `public/default-avatar.png` (same artwork).
 */
export const DEFAULT_AVATAR_IMAGE = DEFAULT_AVATAR_WEB_PATH;

/** Default video when no index. */
export const DEFAULT_PLACEHOLDER_VIDEO = PLACEHOLDER_VIDEOS[0];

export function getPlaceholderImage(index: number): string {
  return PLACEHOLDER_IMAGES[index % PLACEHOLDER_IMAGES.length];
}

export function getPlaceholderVideo(index: number): string {
  return PLACEHOLDER_VIDEOS[index % PLACEHOLDER_VIDEOS.length];
}
