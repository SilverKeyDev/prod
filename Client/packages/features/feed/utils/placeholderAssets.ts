/**
 * Shared placeholder image and video URLs for feed/reels when API is unavailable
 * or media is missing. Use getPlaceholderImage(i) / getPlaceholderVideo(i) for
 * variety in test data and fallbacks.
 */

import { DEFAULT_AVATAR_WEB_PATH } from "packages/utils/product/media/defaultAvatar";
import {
  DEFAULT_PLACEHOLDER_IMAGE,
  getPlaceholderImage,
  PLACEHOLDER_IMAGES,
} from "packages/utils/product/media/placeholderAssets";

export { DEFAULT_PLACEHOLDER_IMAGE, getPlaceholderImage, PLACEHOLDER_IMAGES };

/** All use dummy-video.mp4 until you add placeholder-video-1.mp4, placeholder-video-2.mp4 to public/. */
export const PLACEHOLDER_VIDEOS: readonly string[] = [
  "/dummy-video.mp4",
  "/dummy-video.mp4",
  "/dummy-video.mp4",
] as const;

/**
 * Default profile picture when user has no avatar (Instagram-style gray silhouette).
 * Web: `public/default-avatar.svg`. Native: bundled `public/default-avatar.png` (same artwork).
 */
export const DEFAULT_AVATAR_IMAGE = DEFAULT_AVATAR_WEB_PATH;

/** Default video when no index. */
export const DEFAULT_PLACEHOLDER_VIDEO = PLACEHOLDER_VIDEOS[0];

export function getPlaceholderVideo(index: number): string {
  return PLACEHOLDER_VIDEOS[index % PLACEHOLDER_VIDEOS.length];
}
