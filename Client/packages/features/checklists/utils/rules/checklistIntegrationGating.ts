/** Integration steps that must be completed via in-step submit (not a free manual checkbox). */
export const SUBMIT_GATED_CHECKLIST_INTEGRATION_KEYS = new Set([
  "set_budget",
  "choose_areas",
  "define_criteria",
  "partner_agent",
]);

export function isSubmitGatedChecklistIntegration(item: {
  component_key?: string | null;
  componentKey?: string | null;
  completionRequiresSubmit?: boolean | null;
}): boolean {
  const key = item.component_key ?? item.componentKey ?? null;
  if (key != null && SUBMIT_GATED_CHECKLIST_INTEGRATION_KEYS.has(key)) {
    return true;
  }
  return item.completionRequiresSubmit === true;
}
