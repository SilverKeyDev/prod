/** True when demographics `is_agent` marks a real estate agent (aligns with server / useIsAgent). */
export function isAgentFormSelection(is_agent: string | undefined): boolean {
  return is_agent === "yes" || is_agent === "am_agent";
}
