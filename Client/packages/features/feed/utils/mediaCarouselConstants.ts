import { screenUp } from "packages/ui/types/screens";
import { getNavigator } from "packages/utils/core/platform";

/**
 * True when the user has requested reduced data usage (e.g. Data Saver).
 * Safe for SSR (returns false when navigator is undefined).
 */
export function isLowDataMode(): boolean {
  const nav = getNavigator();
  if (!nav) return false;
  return (nav as Navigator & { connection?: { saveData?: boolean } }).connection?.saveData === true;
}

/** Max movement (px) to still count as a tap (vs drag). */
export const TAP_MOVE_THRESHOLD_PX = 10;

/** Minimum drag distance (px) before carousel responds on small screens. */
export const DRAG_THRESHOLD_SMALL = 10;

/** Minimum drag distance (px) before carousel responds on large screens (reduces accidental swipes). */
export const DRAG_THRESHOLD_LARGE = 120;

/** Cooldown (ms) between wheel-triggered slide traversals to avoid skipping slides. */
export const WHEEL_TRAVERSAL_COOLDOWN_MS = 500;

/** Media query string for "md" and up (min-width: 768px). */
export const LARGE_SCREEN_MEDIA = screenUp("md");
