/**
 * Tab bar configuration: icon mapping for native bottom tabs.
 * Shared so AppStack.native and any tab-related logic stay consistent.
 * No platform APIs; only constants.
 */

import type { IconName } from "packages/ui/types/icons";

/** Bottom tab names (must match React Navigation tab screen names). */
export const APP_TAB_NAMES = ["Dashboard", "Search", "Library", "Messaging", "Profile"] as const;

export type AppTabName = (typeof APP_TAB_NAMES)[number];

/** Tab screen name to icon name for native tab bar. */
export const TAB_ICONS: Record<AppTabName, IconName> = {
  Dashboard: "home",
  Search: "search",
  Library: "bookmark",
  Messaging: "send",
  Profile: "user",
};
