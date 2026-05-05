/**
 * Shared types for stack/screen params used by native navigators and deep linking.
 * No platform APIs; only type definitions.
 */

/** Params for the Property Details screen (shared with route params). */
export type PropertyDetailsScreenParams = {
  address: string;
  propertyId?: string;
};

/** Params for native full-screen public agent profile (matches web `/agent-profile/...` and `/a/...`). */
export type AgentProfileScreenParams =
  | { agentUserId: string; displayName?: string }
  | { publicProfileSlug: string };

/**
 * Result of resolving post-auth redirect path.
 * Native navigator uses this to call rootNavigationRef.navigate accordingly.
 */
export type PostAuthRedirectTarget =
  | { type: "main"; screen: string }
  | { type: "onboarding" }
  | null;
