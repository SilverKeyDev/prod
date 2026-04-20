import type { TaskChecklistItem } from "packages/features/checklists/api/checklists";

export type ChecklistFormsCardVariant = "default" | "document";

/**
 * Checklist step UI for suggested forms. API uses `forms_card_variant`; omit = default.
 */
export function getFormsCardVariant(item: TaskChecklistItem): ChecklistFormsCardVariant {
  if (item.forms_card_variant === "document") return "document";
  return "default";
}
