import type { ChecklistSectionId } from "./sectionOrder";

/** Canonical step id: `{section}:{itemId}` (e.g. closing:13). */
export function buildStepId(section: ChecklistSectionId, itemId: number): string {
  return `${section}:${itemId}`;
}

export function parseStepId(stepId: string): { section: string; itemId: number } | null {
  const idx = stepId.lastIndexOf(":");
  if (idx <= 0) return null;
  const section = stepId.slice(0, idx);
  const itemId = Number(stepId.slice(idx + 1));
  if (!section || !Number.isFinite(itemId)) return null;
  return { section, itemId };
}
