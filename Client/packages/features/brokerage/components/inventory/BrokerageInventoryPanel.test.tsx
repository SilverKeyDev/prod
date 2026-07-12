import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { render, screen } from "@testing-library/react";
import type { ReactElement } from "react";
import { describe, expect, it, vi } from "vitest";

import { LocalizationProvider } from "packages/contexts";

vi.mock("./InventoryMapPanel", () => ({
  InventoryMapPanel: () => <div data-testid="inventory-map" />,
}));

vi.mock("packages/store", () => ({
  useAuthStore: (selector: (s: { user: null }) => unknown) => selector({ user: null }),
}));

import { BrokerageInventoryPanel } from "./BrokerageInventoryPanel";

function renderPanel(ui: ReactElement) {
  const queryClient = new QueryClient({
    defaultOptions: { queries: { retry: false } },
  });
  return render(
    <QueryClientProvider client={queryClient}>
      <LocalizationProvider>{ui}</LocalizationProvider>
    </QueryClientProvider>
  );
}

describe("BrokerageInventoryPanel", () => {
  it("renders KPIs, filter button rows, map shell, and no listing cards", async () => {
    renderPanel(<BrokerageInventoryPanel timePeriod="month" />);
    expect(await screen.findByTestId("brokerage-inventory-panel")).toBeTruthy();
    expect(screen.getByTestId("inventory-kpi-strip")).toBeTruthy();
    expect(screen.getByTestId("inventory-filters")).toBeTruthy();
    expect(screen.getByTestId("inventory-filter-neighborhoods")).toBeTruthy();
    expect(screen.getByTestId("inventory-filter-property-types")).toBeTruthy();
    expect(screen.getByRole("button", { name: "All neighborhoods" })).toBeTruthy();
    expect(screen.getByRole("button", { name: "All types" })).toBeTruthy();
    expect(screen.getByRole("button", { name: "Lower-class" })).toBeTruthy();
    expect(screen.getByRole("button", { name: "Single Family" })).toBeTruthy();
    expect(screen.getByText("Avg price")).toBeTruthy();
    expect(screen.getByTestId("inventory-map-shell")).toBeTruthy();
    expect(screen.getByTestId("inventory-map")).toBeTruthy();
    expect(screen.queryByTestId("inventory-list")).toBeNull();
    expect(screen.queryByLabelText("Property type")).toBeNull();
  });
});
