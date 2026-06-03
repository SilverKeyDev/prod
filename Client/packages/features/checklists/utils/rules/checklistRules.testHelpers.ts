import type { TaskChecklistItem } from "packages/features/checklists/api/checklists";

export function checklistRulesTestItem(
  partial: Partial<TaskChecklistItem> & Pick<TaskChecklistItem, "id" | "label" | "explanation">
): TaskChecklistItem {
  return {
    label: partial.label,
    explanation: partial.explanation,
    ...partial,
  };
}
