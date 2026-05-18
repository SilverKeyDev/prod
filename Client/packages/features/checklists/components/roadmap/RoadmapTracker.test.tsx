import { fireEvent, render, screen } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";

import { CHECKLIST_TITLES, type ChecklistTab } from "packages/features/checklists/types/checklists";
import { buildBuyerRoadmapPhases } from "packages/features/checklists/utils/roadmap/buildBuyerRoadmapPhases";

import { RoadmapTracker } from "./RoadmapTracker";

vi.mock("packages/contexts", () => ({
  useLocalization: () => ({
    t: (key: string, opts?: Record<string, string | number>) => {
      if (key === "checklists.roadmap_tracker.phase_aria" && opts) {
        return `${opts.label}, ${opts.status}. ${opts.tasks}`;
      }
      if (key === "checklists.roadmap_tracker.tasks_inline" && opts) {
        return `${opts.completed} of ${opts.total} tasks`;
      }
      if (typeof opts === "object" && opts != null && "label" in opts) {
        return String(opts.label);
      }
      return key;
    },
  }),
}));

function emptyProgress(
  overrides: Partial<
    Record<ChecklistTab, { completed: number; total: number; isComplete: boolean }>
  > = {}
): Record<ChecklistTab, { completed: number; total: number; isComplete: boolean }> {
  const tabs: ChecklistTab[] = ["search", "offer", "escrow", "inspections", "financing", "closing"];
  const base = {} as Record<
    ChecklistTab,
    { completed: number; total: number; isComplete: boolean }
  >;
  for (const t of tabs) {
    base[t] = overrides[t] ?? { completed: 0, total: 1, isComplete: false };
  }
  return base;
}

describe("buildBuyerRoadmapPhases", () => {
  it("marks locked phases when section is not unlocked", () => {
    const phases = buildBuyerRoadmapPhases({
      sectionProgress: emptyProgress({
        search: { completed: 1, total: 1, isComplete: true },
      }),
      isSectionUnlocked: (s) => s === "search" || s === "offer",
      labelsByTab: CHECKLIST_TITLES,
      selectedPhaseId: "search",
      journeyPhaseId: "offer",
    });
    expect(phases.find((p) => p.id === "escrow")?.status).toBe("locked");
  });

  it("marks complete and active journey correctly", () => {
    const phases = buildBuyerRoadmapPhases({
      sectionProgress: emptyProgress({
        search: { completed: 1, total: 1, isComplete: true },
        offer: { completed: 0, total: 2, isComplete: false },
      }),
      isSectionUnlocked: () => true,
      labelsByTab: CHECKLIST_TITLES,
      selectedPhaseId: "offer",
      journeyPhaseId: "offer",
    });
    expect(phases.find((p) => p.id === "search")?.status).toBe("complete");
    expect(phases.find((p) => p.id === "offer")?.status).toBe("active");
    expect(phases.find((p) => p.id === "escrow")?.status).toBe("available");
  });
});

describe("RoadmapTracker", () => {
  it("calls onPhaseSelect when a locked phase is activated", () => {
    const onPhaseSelect = vi.fn();
    const phases = [
      {
        id: "a",
        label: "Alpha",
        status: "locked" as const,
        completedTasks: 0,
        totalTasks: 1,
        isSelected: false,
      },
      {
        id: "b",
        label: "Beta",
        status: "active" as const,
        completedTasks: 0,
        totalTasks: 1,
        isSelected: true,
      },
    ];
    render(
      <RoadmapTracker
        phases={phases}
        activePhaseId="b"
        journeyPhaseId="b"
        onPhaseSelect={onPhaseSelect}
      />
    );
    const nav = screen.getByRole("navigation");
    const lockedBtn = nav.querySelector('button[data-phase-id="a"]');
    expect(lockedBtn).toBeTruthy();
    fireEvent.click(lockedBtn!);
    expect(onPhaseSelect).toHaveBeenCalledWith("a");
  });

  it("calls onPhaseSelect for a tappable phase", () => {
    const onPhaseSelect = vi.fn();
    const phases = [
      {
        id: "a",
        label: "Alpha",
        status: "complete" as const,
        completedTasks: 1,
        totalTasks: 1,
        isSelected: false,
      },
      {
        id: "b",
        label: "Beta",
        status: "active" as const,
        completedTasks: 0,
        totalTasks: 1,
        isSelected: true,
      },
    ];
    render(
      <RoadmapTracker
        phases={phases}
        activePhaseId="b"
        journeyPhaseId="b"
        onPhaseSelect={onPhaseSelect}
      />
    );
    const nav = screen.getByRole("navigation");
    const alphaBtn = nav.querySelector('button[data-phase-id="a"]');
    expect(alphaBtn).toBeTruthy();
    fireEvent.click(alphaBtn!);
    expect(onPhaseSelect).toHaveBeenCalledWith("a");
  });

  it("renders desktop phase nodes with icons for active phases", () => {
    const phases = [
      {
        id: "search",
        label: "Search",
        status: "complete" as const,
        completedTasks: 1,
        totalTasks: 1,
        isSelected: false,
      },
      {
        id: "offer",
        label: "Offer",
        status: "active" as const,
        completedTasks: 0,
        totalTasks: 2,
        isSelected: true,
      },
    ];
    const { container } = render(
      <RoadmapTracker
        phases={phases}
        activePhaseId="offer"
        journeyPhaseId="offer"
        onPhaseSelect={vi.fn()}
      />
    );
    const offerBtn = container.querySelector(
      'button[data-phase-id="offer"][data-layout="desktop"]'
    );
    expect(offerBtn?.querySelector('[data-testid="phase-icon-slot"]')).toBeTruthy();
    expect(offerBtn?.querySelector('[data-testid="phase-cell-dominant"]')).toBeTruthy();
  });

  it("renders sequence chevrons between desktop phases", () => {
    const phases = [
      {
        id: "search",
        label: "Search",
        status: "complete" as const,
        completedTasks: 1,
        totalTasks: 1,
        isSelected: false,
      },
      {
        id: "offer",
        label: "Offer",
        status: "active" as const,
        completedTasks: 0,
        totalTasks: 2,
        isSelected: true,
      },
      {
        id: "escrow",
        label: "Escrow",
        status: "locked" as const,
        completedTasks: 0,
        totalTasks: 1,
        isSelected: false,
      },
    ];
    const { container } = render(
      <RoadmapTracker
        phases={phases}
        activePhaseId="offer"
        journeyPhaseId="offer"
        onPhaseSelect={vi.fn()}
      />
    );
    expect(container.querySelectorAll('[data-testid="phase-sequence-chevron"]')).toHaveLength(2);
  });
});
