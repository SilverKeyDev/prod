/** Keys used by the backend to identify checklist items with custom UI components. */
export type ChecklistComponentKey =
  | "choose_areas"
  | "define_criteria"
  | "set_budget"
  | "finding_home"
  | "home_concierge"
  | "review_comparables";

/** Props expected by checklist integration components. */
export type ChecklistIntegrationComponentProps = {
  onComplete?: () => void;
};

const VALID_KEYS: ChecklistComponentKey[] = [
  "choose_areas",
  "define_criteria",
  "set_budget",
  "finding_home",
  "home_concierge",
  "review_comparables",
];

/** Runtime check for valid component keys when looking up unknown backend values. */
export function isChecklistComponentKey(key: string | undefined): key is ChecklistComponentKey {
  return key != null && (VALID_KEYS as string[]).includes(key);
}
