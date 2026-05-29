/** True when demographics `is_agent` marks a real estate agent (aligns with server / useIsAgent). */
export function isAgentFormSelection(is_agent: string | undefined): boolean {
  return is_agent === "yes" || is_agent === "am_agent";
}

/**
 * For buyer-preference UI (optional callouts): true if the auth user is an agent or the form
 * draft says agent (onboarding before store updates).
 */
export function effectiveIsAgentForOptionalBuyerUi(options: {
  authIsAgent: boolean;
  formIsAgent?: string;
}): boolean {
  return options.authIsAgent || isAgentFormSelection(options.formIsAgent);
}
