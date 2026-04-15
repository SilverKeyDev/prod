import type { TaskChecklistItem } from "packages/features/checklists/api/checklists";
import type { ChecklistItem } from "packages/ui/components/form/checkbox/ChecklistCheckbox";

/** Shared Tailwind classes for `ChecklistCheckbox` rows (dashboard, client hub, close layouts). */
export const checklistCheckboxRowClassNames = {
  checkboxContainer: "flex flex-row w-full items-start gap-responsive-xs",
  itemLabel: "text-left font-medium text-text-primary text-responsive-sm",
  itemExplanation: "text-left text-text-secondary text-responsive-xs mt-1",
} as const;

export function toChecklistCheckboxItem(
  item: TaskChecklistItem,
): ChecklistItem {
  const resource =
    item.resource != null &&
    item.resource.label != null &&
    String(item.resource.label).trim() !== ""
      ? {
          label: item.resource.label,
          href: item.resource.href ?? undefined,
        }
      : undefined;

  return {
    id: item.id,
    label: item.label,
    explanation: item.explanation ?? "",
    bullets: item.bullets ?? undefined,
    tip: item.tip ?? undefined,
    resource,
    optional: item.optional ?? undefined,
  };
}
