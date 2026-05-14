import { useContext } from "react";

import { ChecklistUpdatePendingContext } from "packages/features/checklists/components/roadmap/checklistUpdatePendingContext";

/** When no provider is present (e.g. non-checklist pages), returns false. */
export function useOptionalChecklistUpdatePending(): boolean {
  return useContext(ChecklistUpdatePendingContext);
}
