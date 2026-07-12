import { render, screen } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";

vi.mock("./InventoryMapPanel", () => ({
  InventoryMapPanel: () => <div data-testid="inventory-map" />,
}));

vi.mock("packages/features/search/components/list/SidebarList.web", () => ({
  SidebarList: ({ items }: { items: { address?: string }[] }) => (
    <div data-testid="inventory-sidebar-list">
      {items.map((item, i) => (
        <div key={i}>{item.address}</div>
      ))}
    </div>
  ),
}));

import { BrokerageInventoryPanel } from "./BrokerageInventoryPanel";

describe("BrokerageInventoryPanel", () => {
  it("renders KPI strip, search-style shell, map, and sidebar cards", async () => {
    render(<BrokerageInventoryPanel />);
    expect(await screen.findByTestId("brokerage-inventory-panel")).toBeTruthy();
    expect(screen.getByTestId("inventory-kpi-strip")).toBeTruthy();
    expect(screen.getByTestId("inventory-search-shell")).toBeTruthy();
    expect(screen.getByTestId("inventory-map")).toBeTruthy();
    expect(screen.getByTestId("inventory-list")).toBeTruthy();
    expect(screen.getByTestId("inventory-sidebar-list")).toBeTruthy();
    expect(screen.getByText(/Peachtree/i)).toBeTruthy();
  });
});
