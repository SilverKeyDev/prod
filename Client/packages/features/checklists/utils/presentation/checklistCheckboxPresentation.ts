import type { TaskChecklistItem } from "packages/features/checklists/api/checklists";
import type { ChecklistItem } from "packages/ui";

/** Shared shell layout for checklist row containers (roadmap Card inner, close layout Box). */
export const checklistRowShellClassNames = {
  innerPadding: "px-4 py-2",
  fullWidth: "w-full box-border",
} as const;

/** Shared Tailwind classes for `ChecklistCheckbox` rows (dashboard, client hub, close layouts). */
export const checklistCheckboxRowClassNames = {
  checkboxContainer: "grid w-full grid-cols-[auto_minmax(0,1fr)] items-start gap-x-responsive-xs",
  itemLabel: "text-left font-medium leading-snug text-text-primary text-responsive-sm",
  itemExplanation: "text-left text-text-secondary text-responsive-xs mt-1",
} as const;

export type ChecklistItemBorderVariant = "light" | "dotted";

/** Roadmap Card border — always 1px so active/inactive rows share the same box width. */
export function getChecklistItemBorderVariant(checked: boolean): ChecklistItemBorderVariant {
  return checked ? "dotted" : "light";
}

export type ChecklistItemLabelClassOptions = {
  checked?: boolean;
  disabled?: boolean;
  roadmapSoftBlocked?: boolean;
};

/**
 * Label styling for checklist rows. Color/opacity only — no padding, margin, or border
 * changes between checked and unchecked so toggling does not shift row width.
 */
export function getChecklistItemLabelClass(options: ChecklistItemLabelClassOptions = {}): string {
  const { checked = false, disabled = false, roadmapSoftBlocked = false } = options;
  const parts = [checklistCheckboxRowClassNames.itemLabel];

  if (roadmapSoftBlocked) {
    parts.push("opacity-70");
  } else if (disabled) {
    parts.push("opacity-75");
  } else if (checked) {
    parts.push("text-text-secondary");
  }

  return parts.join(" ");
}

export function toChecklistCheckboxItem(item: TaskChecklistItem): ChecklistItem {
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
