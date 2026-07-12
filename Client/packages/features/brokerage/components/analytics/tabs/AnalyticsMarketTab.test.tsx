import { render, screen } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";

vi.mock("packages/features/brokerage/components/inventory/BrokerageInventoryPanel", () => ({
  BrokerageInventoryPanel: () => <div data-testid="brokerage-inventory-panel" />,
}));

import { AnalyticsMarketTab } from "./AnalyticsMarketTab";

describe("AnalyticsMarketTab", () => {
  it("renders inventory panel without heatmap", () => {
    render(<AnalyticsMarketTab />);
    expect(screen.getByTestId("analytics-market-tab")).toBeTruthy();
    expect(screen.getByTestId("brokerage-inventory-panel")).toBeTruthy();
    expect(screen.queryByTestId("analytics-heatmap")).toBeNull();
  });
});
