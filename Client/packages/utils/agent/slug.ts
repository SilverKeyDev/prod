/**
 * URL-safe slug and path helpers for public agent profile share links.
 *
 * Web routes use `/agent-profile/{nameSlug}/{userId}` (name segment first, then agent user id).
 * Legacy URLs used `/agent-profile/{userId}/{nameSlug}`; {@link resolveAgentProfileRouteParams} maps both.
 */

import { isLikelyUserUuid } from "./pendingPublicAgentConnect";

export function generateAgentProfileSlug(displayName: string): string {
  return displayName
    .toLowerCase()
    .replace(/[^a-z0-9\s-]/g, "")
    .replace(/\s+/g, "-")
    .replace(/-+/g, "-")
    .replace(/^-+|-+$/g, "")
    .trim();
}

export function buildAgentProfileUrl(agentId: string, displayName: string): string {
  const id = agentId.trim();
  if (!id) {
    throw new Error("agentId is required to build agent profile URL");
  }
  const name = generateAgentProfileSlug(displayName.trim() || "agent");
  return `/agent-profile/${name}/${encodeURIComponent(id)}`;
}

export function parseAgentProfileUrl(url: string): {
  /** URL segment derived from display name (name slug). */
  name: string;
  /** Second path segment; resolves to agent user id for API lookup. */
  briefSlug: string;
} | null {
  const match = url.match(/\/agent-profile\/([^/]+)\/([^/?#]+)/);
  if (!match) return null;
  return {
    name: match[1],
    briefSlug: decodeURIComponent(match[2]),
  };
}

/**
 * Maps React Router params to the agent user id used by `GET /api/v1/public/agent-profile/{userId}`.
 *
 * - Current URLs: first segment = display-name slug, second = user id.
 * - Legacy URLs: first segment = RFC4122 user id, second = display-name slug; still accepted for shared links.
 */
export function resolveAgentProfileRouteParams(
  nameParam: string | undefined,
  briefSlugParam: string | undefined
): {
  agentUserId: string | null;
  /** True when the path matched the legacy id-first segment order. */
  legacyUuidFirst: boolean;
} {
  const first = nameParam?.trim() ?? "";
  const second = briefSlugParam?.trim() ?? "";
  if (!first || !second) {
    return { agentUserId: null, legacyUuidFirst: false };
  }
  if (isLikelyUserUuid(first) && !isLikelyUserUuid(second)) {
    return { agentUserId: first, legacyUuidFirst: true };
  }
  try {
    return {
      agentUserId: decodeURIComponent(second) || null,
      legacyUuidFirst: false,
    };
  } catch {
    return { agentUserId: second || null, legacyUuidFirst: false };
  }
}
