/** Inputs for showing the logged-in agent's public profile URL (profile vs auth store). */
export type AgentPublicProfileShareInput = {
  storeIsAgent: boolean;
  authUser: {
    id?: string;
    name?: string | null;
  } | null;
  userProfile: {
    id?: string;
    name?: string | null;
    is_agent?: boolean;
    roles?: readonly string[] | null;
  } | null;
};

export type AgentPublicProfileShareResolution = {
  show: boolean;
  agentId: string;
  displayName: string | null | undefined;
};

/** Agent-ness for profile/settings UI: Zustand flag and/or profile payload (incl. `roles`). */
export function isAgentIdentityForProfileUi(
  storeIsAgent: boolean,
  userProfile: AgentPublicProfileShareInput["userProfile"]
): boolean {
  const profileIndicatesAgent =
    Boolean(userProfile?.is_agent) || Boolean(userProfile?.roles?.includes("agent"));
  return storeIsAgent || profileIndicatesAgent;
}

/**
 * Resolves whether to show the public agent profile link and which user id to use.
 * Prefer profile query data; fall back to auth store so the row appears when the profile
 * request is still in flight or omits fields the store already has from session/bootstrap.
 */
export function resolveAgentPublicProfileShare(
  input: AgentPublicProfileShareInput
): AgentPublicProfileShareResolution {
  const { storeIsAgent, authUser, userProfile } = input;
  const isAgentForUi = isAgentIdentityForProfileUi(storeIsAgent, userProfile);
  const agentId = `${userProfile?.id ?? authUser?.id ?? ""}`.trim();
  const show = Boolean(agentId && isAgentForUi);
  const displayName = userProfile?.name ?? authUser?.name;
  return { show, agentId, displayName };
}
