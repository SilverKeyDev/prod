import { fireEvent, render, screen } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";

const mockSetActive = vi.fn();
const mockAllowed = vi.fn(
  () => ["buyer", "seller", "agent", "brokerage", "integration_partner"] as const
);
const mockActive = vi.fn(() => "buyer" as const);

vi.mock("packages/contexts", () => ({
  useLocalization: () => ({
    t: (key: string) => key,
  }),
}));

vi.mock("packages/hooks/store", () => ({
  useAllowedWorkspaces: () => mockAllowed(),
  useActiveWorkspace: () => mockActive(),
  useSetActiveWorkspace: () => mockSetActive,
}));

import { WorkspaceSwitcher } from "./WorkspaceSwitcher.web";

describe("WorkspaceSwitcher", () => {
  it("renders allowed workspace options", () => {
    render(<WorkspaceSwitcher forceVisible />);
    expect(screen.getByTestId("workspace-switcher")).toBeTruthy();
    expect(screen.getByRole("button", { name: "workspace.switcher.buyer" })).toBeTruthy();
    expect(screen.getByRole("button", { name: "workspace.switcher.seller" })).toBeTruthy();
  });

  it("calls setActiveWorkspace when another workspace is selected", () => {
    render(<WorkspaceSwitcher forceVisible />);
    fireEvent.click(screen.getByRole("button", { name: "workspace.switcher.seller" }));
    expect(mockSetActive).toHaveBeenCalledWith("seller");
  });
});
