import { fireEvent, render, screen, waitFor } from "@testing-library/react";
import { beforeEach, describe, expect, it, vi } from "vitest";

import type { TaskChecklistItem } from "packages/features/checklists/api/checklists";

import { ChecklistLayoutItemRow } from "./ChecklistLayoutItemRow";

const showWarningToast = vi.fn();

vi.mock("packages/contexts", () => ({
  useLocalization: () => ({
    t: (_key: string, opts?: { defaultValue?: string }) => opts?.defaultValue ?? _key,
  }),
}));

vi.mock("packages/hooks/ui/toast/useToast", () => ({
  showWarningToast: (...args: unknown[]) => showWarningToast(...args),
}));

vi.mock("packages/features/checklists/components/slots/ChecklistIntegrationSlot", () => ({
  default: ({ onComplete }: { onComplete: () => void }) => (
    <button type="button" onClick={onComplete}>
      mock-integration-complete
    </button>
  ),
}));

vi.mock("packages/ui", async (importOriginal) => {
  const actual = await importOriginal<typeof import("packages/ui")>();
  return {
    ...actual,
    ChecklistCheckbox: ({ item, onToggle }: { item: { label: string }; onToggle: () => void }) => (
      <button type="button" onClick={onToggle}>
        {item.label}
      </button>
    ),
  };
});

function checklistItem(
  partial: Partial<TaskChecklistItem> & Pick<TaskChecklistItem, "id" | "label" | "explanation">
): TaskChecklistItem {
  return {
    ...partial,
    label: partial.label,
    explanation: partial.explanation,
    component_key: partial.component_key ?? "set_budget",
    completionRequiresSubmit: partial.completionRequiresSubmit ?? true,
  };
}

describe("ChecklistLayoutItemRow integration submit", () => {
  beforeEach(() => {
    showWarningToast.mockReset();
  });

  it("calls commitToggleItem on integration complete when eligible", async () => {
    const commitToggleItem = vi.fn().mockResolvedValue(undefined);
    const onToggleItem = vi.fn();

    render(
      <ChecklistLayoutItemRow
        item={checklistItem({ id: 5, label: "Define criteria", explanation: "" })}
        rowKind="current"
        globalIndex={0}
        checkedById={{}}
        activeItemIds={[5]}
        roadmapTab="search"
        getItemToggleEligibility={() => ({
          canCheck: false,
          canUncheck: false,
          canMarkChecked: true,
        })}
        onToggleItem={onToggleItem}
        commitToggleItem={commitToggleItem}
        toggleExpand={vi.fn()}
        isExpanded={() => true}
      />
    );

    fireEvent.click(screen.getByRole("button", { name: "mock-integration-complete" }));

    await waitFor(() => {
      expect(commitToggleItem).toHaveBeenCalledWith(5);
    });
    expect(onToggleItem).not.toHaveBeenCalled();
  });

  it("expands the row when collapsed and the title area is clicked", () => {
    const toggleExpand = vi.fn();

    const { container } = render(
      <ChecklistLayoutItemRow
        item={checklistItem({ id: 5, label: "Define criteria", explanation: "Details" })}
        rowKind="current"
        globalIndex={0}
        checkedById={{}}
        activeItemIds={[5]}
        roadmapTab="search"
        getItemToggleEligibility={() => ({
          canCheck: true,
          canUncheck: true,
          canMarkChecked: true,
        })}
        onToggleItem={vi.fn()}
        commitToggleItem={vi.fn()}
        toggleExpand={toggleExpand}
        isExpanded={() => false}
      />
    );

    const expandTarget = container.querySelector('[role="button"][aria-label*="Define criteria"]');
    expect(expandTarget).not.toBeNull();
    fireEvent.click(expandTarget!);

    expect(toggleExpand).toHaveBeenCalledWith(5);
  });

  it("does not call commitToggleItem when not eligible", async () => {
    const commitToggleItem = vi.fn();

    render(
      <ChecklistLayoutItemRow
        item={checklistItem({ id: 5, label: "Define criteria", explanation: "" })}
        rowKind="current"
        globalIndex={0}
        checkedById={{}}
        activeItemIds={[5]}
        roadmapTab="search"
        getItemToggleEligibility={() => ({
          canCheck: false,
          canUncheck: false,
          canMarkChecked: false,
        })}
        onToggleItem={vi.fn()}
        commitToggleItem={commitToggleItem}
        toggleExpand={vi.fn()}
        isExpanded={() => true}
      />
    );

    fireEvent.click(screen.getByRole("button", { name: "mock-integration-complete" }));

    await waitFor(() => {
      expect(showWarningToast).toHaveBeenCalled();
    });
    expect(commitToggleItem).not.toHaveBeenCalled();
  });
});
