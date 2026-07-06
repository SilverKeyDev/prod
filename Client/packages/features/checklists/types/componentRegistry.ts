/** Keys used by the backend to identify checklist items with custom UI components. */
export type ChecklistComponentKey =
  | "choose_areas"
  | "define_criteria"
  | "set_budget"
  | "finding_home"
  | "partner_placements"
  | "partner_agent"
  | "buyer_broker_review"
  | "review_comparables";

import type { PartnerPlacement } from "packages/features/partners/api/partners";

/** Props expected by checklist integration components. */
export type ChecklistIntegrationComponentProps = {
  onComplete?: () => void;
  stepId?: string;
  transactionId?: string | null;
  /** Active rev-share placements for this checklist step (from ChecklistIntegrationSlot). */
  placements?: PartnerPlacement[];
  placementsLoading?: boolean;
};

const VALID_KEYS: ChecklistComponentKey[] = [
  "choose_areas",
  "define_criteria",
  "set_budget",
  "finding_home",
  "partner_placements",
  "partner_agent",
  "buyer_broker_review",
  "review_comparables",
];

/** Runtime check for valid component keys when looking up unknown backend values. */
export function isChecklistComponentKey(key: string | undefined): key is ChecklistComponentKey {
  return key != null && (VALID_KEYS as string[]).includes(key);
}
