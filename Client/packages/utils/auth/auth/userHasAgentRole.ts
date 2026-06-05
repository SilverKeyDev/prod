/** True when user_roles includes the agent role (canonical agent identity check). */
export function userHasAgentRole(
  user: { roles?: readonly string[] | null } | null | undefined
): boolean {
  return user?.roles?.some((role) => role === "agent") ?? false;
}
