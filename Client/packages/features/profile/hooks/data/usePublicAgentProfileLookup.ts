import { useMemo } from "react";

import { usePublicAgentProfile } from "packages/features/agent/hooks/data/public/usePublicAgentProfile";
import { useUserData } from "packages/hooks/data/user/useUserData";
import { useRouteParams } from "packages/navigation";
import { useAuthStore } from "packages/store";
import { resolveAgentProfileRouteParams } from "packages/utils/growth/agent";

/**
 * Resolves the public agent profile for the current route (`/a/:publicSlug` or
 * `/agent-profile/:name/:briefSlug`) and derives viewer ownership. Shared by the
 * public-site shell and the profile page content; the underlying query is
 * deduped by react-query, so calling it from both is free.
 */
export function usePublicAgentProfileLookup() {
  const {
    publicSlug,
    briefSlug,
    name: nameSegment,
  } = useRouteParams<{
    publicSlug?: string;
    name?: string;
    briefSlug?: string;
  }>();
  const routeSlug = publicSlug?.trim() ?? "";

  const { agentUserId } = useMemo(() => {
    if (routeSlug) {
      return { agentUserId: null };
    }
    return resolveAgentProfileRouteParams(nameSegment, briefSlug);
  }, [routeSlug, nameSegment, briefSlug]);

  const profileQueryUserId = agentUserId ?? undefined;

  const query = usePublicAgentProfile(
    routeSlug
      ? { publicProfileSlug: routeSlug }
      : { userId: profileQueryUserId },
  );
  const agent = query.data;

  const agentId = useMemo(
    () => (routeSlug ? agent?.id?.trim() : profileQueryUserId?.trim()) ?? "",
    [routeSlug, agent?.id, profileQueryUserId],
  );

  const hasLookup = Boolean(routeSlug) || Boolean(profileQueryUserId?.trim());

  const authUser = useAuthStore((s) => s.user);
  const isAuthenticated = useAuthStore((s) => s.isAuthenticated);
  const { userProfile } = useUserData();
  const viewerId = isAuthenticated
    ? (userProfile?.id ?? authUser?.id ?? null)
    : null;
  const isOwnProfile = Boolean(
    viewerId && agent?.id && viewerId === agent.id.trim(),
  );

  return {
    ...query,
    agent,
    agentId,
    hasLookup,
    routeSlug,
    nameSegment,
    isAuthenticated,
    isOwnProfile,
  };
}
