import { render, screen } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";

import { PhaseNode } from "./PhaseNode";

vi.mock("@ui/icons", () => ({
  Icon: ({ name, className }: { name: string; className?: string }) => (
    <span data-testid={`icon-${name}`} className={className} />
  ),
}));

const basePhase = {
  id: "offer",
  label: "Offer",
  completedTasks: 0,
  totalTasks: 2,
  isSelected: true,
};

describe("PhaseNode desktop layout", () => {
  it("renders phase icon in row for active status", () => {
    render(
      <PhaseNode
        layout="desktop"
        phase={{ ...basePhase, status: "active" }}
        journeyPhaseId="offer"
        ariaLabel="Offer"
        tabIndex={0}
      />
    );
    const node = screen.getByRole("button");
    expect(node.querySelector('[data-testid="icon-file-signature"]')).toBeTruthy();
    expect(node.querySelector('[data-testid="phase-icon-slot"]')).toBeTruthy();
  });

  it("marks the active journey stage as visually dominant", () => {
    render(
      <PhaseNode
        layout="desktop"
        phase={{ ...basePhase, status: "active" }}
        journeyPhaseId="offer"
        ariaLabel="Offer"
        tabIndex={0}
      />
    );
    const dominant = screen.getByTestId("phase-cell-dominant");
    expect(dominant.className).toContain("border-gold");
    expect(dominant.className).toContain("bg-gold-muted");
    expect(screen.queryByTestId("journey-dot")).toBeNull();
  });

  it("uses gold icon color when selected", () => {
    render(
      <PhaseNode
        layout="desktop"
        phase={{ ...basePhase, status: "active" }}
        journeyPhaseId="offer"
        ariaLabel="Offer"
        tabIndex={0}
      />
    );
    const icon = screen.getByTestId("icon-file-signature");
    expect(icon.className).toContain("text-gold");
  });

  it("shows dashed bordered cell for locked phases", () => {
    render(
      <PhaseNode
        layout="desktop"
        phase={{
          ...basePhase,
          id: "escrow",
          label: "Escrow",
          status: "locked",
          isSelected: false,
        }}
        journeyPhaseId="offer"
        ariaLabel="Escrow"
        tabIndex={0}
      />
    );
    expect(screen.getByTestId("phase-cell-locked")).toBeTruthy();
    expect(screen.getByTestId("phase-cell-locked").className).toContain("border-dashed");
  });

  it("keeps icon and label on one row for mobile pills", () => {
    const { container } = render(
      <PhaseNode
        layout="mobile"
        phase={{
          ...basePhase,
          label: "Due diligence and inspection",
          status: "active",
        }}
        journeyPhaseId="offer"
        ariaLabel="Offer"
        tabIndex={0}
        emphasize
      />
    );
    const pill = container.querySelector('[data-layout="mobile"] [class*="rounded-full"]');
    expect(pill?.className).toContain("flex-nowrap");
    expect(pill?.className).not.toContain("flex-wrap");
  });

  it("does not show journey dot when viewing another selected phase", () => {
    render(
      <PhaseNode
        layout="desktop"
        phase={{
          ...basePhase,
          id: "search",
          label: "Search",
          status: "complete",
          isSelected: true,
        }}
        journeyPhaseId="offer"
        ariaLabel="Search"
        tabIndex={0}
      />
    );
    expect(screen.queryByTestId("journey-dot")).toBeNull();
    expect(screen.getByTestId("icon-check")).toBeTruthy();
  });
});
