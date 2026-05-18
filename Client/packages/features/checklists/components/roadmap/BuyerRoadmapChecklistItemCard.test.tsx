import { fireEvent, render, screen, waitFor } from "@testing-library/react";
import { beforeEach, describe, expect, it, vi } from "vitest";

import type { TaskChecklistItem } from "packages/features/checklists/api/checklists";

import { BuyerRoadmapChecklistItemCard } from "./BuyerRoadmapChecklistItemCard";

const showWarningToast = vi.fn();
let capturedOnComplete: (() => void) | null = null;

vi.mock("packages/contexts", () => ({
  useLocalization: () => ({
    t: (_key: string, opts?: { defaultValue?: string }) => opts?.defaultValue ?? _key,
  }),
}));

vi.mock("packages/hooks/ui/toast/useToast", () => ({
  showWarningToast: (...args: unknown[]) => showWarningToast(...args),
}));

vi.mock("packages/features/checklists/components/slots/ChecklistIntegrationSlot", () => ({
  default: ({ onComplete }: { onComplete: () => void }) => {
    capturedOnComplete = onComplete;
    return (
      <button type="button" onClick={onComplete}>
        mock-integration-complete
      </button>
    );
  },
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

const baseProps = {
  rowKind: "current" as const,
  currentTab: "search" as const,
  checkedIds: [] as number[],
  activeItemIds: [2] as const,
  isSectionLocked: false,
  hideIntegrationComponents: false,
  isExpanded: () => true,
  toggleExpand: vi.fn(),
  hubClientUserId: null,
  checklistCategory: null,
  isAgent: false,
  onOpenDispatchModal: vi.fn(),
  getRoadmapItemBlocker: () => null,
  sectionProgress: {
    search: { isComplete: false },
    offer: { isComplete: false },
    escrow: { isComplete: false },
    inspections: { isComplete: false },
    financing: { isComplete: false },
    closing: { isComplete: false },
  },
  onRoadmapTabNavigate: vi.fn(),
  onRevealRoadmapItem: vi.fn(),
  isChecklistUpdatePending: false,
};

describe("BuyerRoadmapChecklistItemCard integration submit", () => {
  beforeEach(() => {
    capturedOnComplete = null;
    showWarningToast.mockReset();
  });

  it("calls commitToggleItem after integration onComplete when canMarkChecked", async () => {
    const commitToggleItem = vi.fn().mockResolvedValue(undefined);
    const onToggleItem = vi.fn();

    render(
      <BuyerRoadmapChecklistItemCard
        {...baseProps}
        item={checklistItem({ id: 2, label: "Set budget", explanation: "Budget step" })}
        getItemToggleEligibility={() => ({
          canCheck: false,
          canUncheck: false,
          canMarkChecked: true,
        })}
        onToggleItem={onToggleItem}
        commitToggleItem={commitToggleItem}
      />
    );

    fireEvent.click(screen.getByRole("button", { name: "mock-integration-complete" }));

    await waitFor(() => {
      expect(commitToggleItem).toHaveBeenCalledWith(2);
    });
    expect(onToggleItem).not.toHaveBeenCalled();
    expect(showWarningToast).not.toHaveBeenCalled();
  });

  it("shows blocked toast and skips PUT when canMarkChecked is false", async () => {
    const commitToggleItem = vi.fn();

    render(
      <BuyerRoadmapChecklistItemCard
        {...baseProps}
        item={checklistItem({ id: 2, label: "Set budget", explanation: "Budget step" })}
        getItemToggleEligibility={() => ({
          canCheck: false,
          canUncheck: false,
          canMarkChecked: false,
        })}
        onToggleItem={vi.fn()}
        commitToggleItem={commitToggleItem}
      />
    );

    fireEvent.click(screen.getByRole("button", { name: "mock-integration-complete" }));

    await waitFor(() => {
      expect(showWarningToast).toHaveBeenCalled();
    });
    expect(commitToggleItem).not.toHaveBeenCalled();
  });

  it("uses latest canMarkChecked via ref when eligibility changes before onComplete runs", async () => {
    const commitToggleItem = vi.fn().mockResolvedValue(undefined);
    let canMarkChecked = false;

    const { rerender } = render(
      <BuyerRoadmapChecklistItemCard
        {...baseProps}
        item={checklistItem({ id: 2, label: "Set budget", explanation: "Budget step" })}
        getItemToggleEligibility={() => ({
          canCheck: false,
          canUncheck: false,
          canMarkChecked,
        })}
        onToggleItem={vi.fn()}
        commitToggleItem={commitToggleItem}
      />
    );

    canMarkChecked = true;
    rerender(
      <BuyerRoadmapChecklistItemCard
        {...baseProps}
        item={checklistItem({ id: 2, label: "Set budget", explanation: "Budget step" })}
        getItemToggleEligibility={() => ({
          canCheck: false,
          canUncheck: false,
          canMarkChecked: true,
        })}
        onToggleItem={vi.fn()}
        commitToggleItem={commitToggleItem}
      />
    );

    expect(capturedOnComplete).toBeTypeOf("function");
    capturedOnComplete?.();

    await waitFor(() => {
      expect(commitToggleItem).toHaveBeenCalledWith(2);
    });
  });

  it("expands the row when collapsed and the title area is clicked", () => {
    const toggleExpand = vi.fn();

    const { container } = render(
      <BuyerRoadmapChecklistItemCard
        {...baseProps}
        item={checklistItem({ id: 2, label: "Set budget", explanation: "Budget step" })}
        getItemToggleEligibility={() => ({
          canCheck: true,
          canUncheck: true,
          canMarkChecked: true,
        })}
        onToggleItem={vi.fn()}
        commitToggleItem={vi.fn()}
        isExpanded={() => false}
        toggleExpand={toggleExpand}
      />
    );

    const expandTarget = container.querySelector('[role="button"][aria-label*="Set budget"]');
    expect(expandTarget).not.toBeNull();
    fireEvent.click(expandTarget!);

    expect(toggleExpand).toHaveBeenCalledWith(2);
  });

  it("shows error toast when commitToggleItem rejects", async () => {
    const commitToggleItem = vi.fn().mockRejectedValue(new Error("network"));

    render(
      <BuyerRoadmapChecklistItemCard
        {...baseProps}
        item={checklistItem({ id: 2, label: "Set budget", explanation: "Budget step" })}
        getItemToggleEligibility={() => ({
          canCheck: false,
          canUncheck: false,
          canMarkChecked: true,
        })}
        onToggleItem={vi.fn()}
        commitToggleItem={commitToggleItem}
      />
    );

    fireEvent.click(screen.getByRole("button", { name: "mock-integration-complete" }));

    await waitFor(() => {
      expect(showWarningToast).toHaveBeenCalledWith(
        "Could not update this step. Please try again."
      );
    });
  });
});
