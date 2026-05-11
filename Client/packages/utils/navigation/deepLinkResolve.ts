/**
 * Pure resolution of pathname to deep link target (auth screen or app tab).
 * No platform APIs; used by useDeepLink.native to decide where to navigate.
 */

import { APP_TAB_DEEP_LINK, AUTH_SCREENS } from "packages/navigation/constants";

/** Longest prefix first so `/library` wins over `/` if we ever add overlapping keys. */
const APP_TAB_PREFIXES = Object.entries(APP_TAB_DEEP_LINK).sort(
  (a, b) => b[0].length - a[0].length
);

function appTabScreenFromPathname(pathname: string): string | null {
  if (pathname === "/settings") return "Profile";
  for (const [prefix, tab] of APP_TAB_PREFIXES) {
    if (pathname === prefix || pathname.startsWith(`${prefix}/`)) {
      return tab;
    }
  }
  return null;
}

export type DeepLinkTarget =
  | { type: "auth"; screen: string }
  | { type: "app"; tab: string }
  /** Authenticated root-stack screen (sibling to `Main`, e.g. FindAgents, AgentProfile). */
  | { type: "rootStack"; screen: string; params?: Record<string, unknown> };

/**
 * Resolve normalized pathname and auth status to a navigation target.
 * /settings is treated as Profile tab when authenticated.
 */
export function resolveDeepLinkTarget(
  normalizedPathname: string,
  isAuthenticated: boolean
): DeepLinkTarget | null {
  if (isAuthenticated) {
    if (normalizedPathname === "/find-agents") {
      return { type: "rootStack", screen: "FindAgents" };
    }
    const tab = appTabScreenFromPathname(normalizedPathname);
    if (tab) return { type: "app", tab };
    return null;
  }
  const screen = AUTH_SCREENS[normalizedPathname] ?? AUTH_SCREENS["/"];
  return { type: "auth", screen };
}
