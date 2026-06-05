import type { ChecklistType } from "./checklists";

export function checklistTypeQueryKey(
  type: ChecklistType,
  transactionId: string
): readonly ["checklists", ChecklistType, string] {
  return ["checklists", type, transactionId] as const;
}

export function checklistProgressSummaryQueryKey(
  transactionId: string
): readonly ["checklists", "progress-summary", string] {
  return ["checklists", "progress-summary", transactionId] as const;
}

export const CHECKLIST_PREFETCH_ROUTE_KEYS = new Set([
  "checklistProgressSummary",
  "checklistSearch",
  "checklistOffer",
  "checklistEscrow",
  "checklistFinancing",
  "checklistClosing",
  "checklistInsurance",
]);

const ROUTE_KEY_TO_CHECKLIST_TYPE: Record<string, ChecklistType> = {
  checklistSearch: "search",
  checklistOffer: "offer",
  checklistEscrow: "escrow",
  checklistFinancing: "financing",
  checklistClosing: "closing",
  checklistInsurance: "insurance",
};

export function checklistTypeForPrefetchRouteKey(routeKey: string): ChecklistType | null {
  return ROUTE_KEY_TO_CHECKLIST_TYPE[routeKey] ?? null;
}

export function isChecklistPrefetchRouteKey(routeKey: string): boolean {
  return CHECKLIST_PREFETCH_ROUTE_KEYS.has(routeKey);
}
