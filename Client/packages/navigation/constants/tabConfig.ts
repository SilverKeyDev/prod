/**
 * Tab bar configuration: icon mapping and badge logic.
 * Shared so AppStack.native and any tab-related logic stay consistent.
 * No platform APIs; only constants and pure functions.
 */

import type { IconName } from "packages/ui/types/icons";

/** Bottom tab names (must match React Navigation tab screen names). */
export const APP_TAB_NAMES = ["Dashboard", "Search", "Saved", "Messaging", "Profile"] as const;

export type AppTabName = (typeof APP_TAB_NAMES)[number];

/** Tab screen name to icon name for native tab bar. */
export const TAB_ICONS: Record<AppTabName, IconName> = {
  Dashboard: "home",
  Search: "search",
  Saved: "bookmark",
  Messaging: "send",
  Profile: "user",
};

/**
 * Resolve tab bar badge value: show count when > 0, otherwise undefined (no badge).
 */
export function getTabBarBadge(count: number): number | undefined {
  return count > 0 ? count : undefined;
}
