/**
 * Pure resolution of pathname to deep link target (auth screen or app tab).
 * No platform APIs; used by useDeepLink.native to decide where to navigate.
 */

import { APP_TAB_DEEP_LINK, AUTH_SCREENS } from "packages/navigation/constants";

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
    const tab =
      APP_TAB_DEEP_LINK[normalizedPathname] ??
      (normalizedPathname === "/settings" ? "Profile" : null);
    if (tab) return { type: "app", tab };
    return null;
  }
  const screen = AUTH_SCREENS[normalizedPathname] ?? AUTH_SCREENS["/"];
  return { type: "auth", screen };
}
