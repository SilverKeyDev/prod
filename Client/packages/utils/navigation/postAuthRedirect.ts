/**
 * Pure logic for resolving post-auth redirect path to a navigation target.
 * No platform APIs; used by RootNavigator.native to decide where to navigate.
 */

import type { PostAuthRedirectTarget } from "packages/navigation/types/stackParams";

/**
 * Normalize path and return the target for post-auth redirect, or null if no redirect.
 */
export function getPostAuthRedirectTarget(path: string | null | undefined): PostAuthRedirectTarget {
  const normalized = (path ?? "").replace(/\/$/, "") || "/";
  if (normalized === "/search") {
    return { type: "main", screen: "Search" };
  }
  if (normalized === "/onboarding") {
    return { type: "onboarding" };
  }
  return null;
}
