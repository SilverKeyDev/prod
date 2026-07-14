import { render, screen } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";

vi.mock("packages/features/brokerage/components/inventory/BrokerageInventoryPanel", () => ({
  BrokerageInventoryPanel: ({ timePeriod }: { timePeriod?: string }) => (
    <div data-testid="brokerage-inventory-panel" data-period={timePeriod} />
  ),
}));

import { AnalyticsMarketTab } from "./AnalyticsMarketTab";

describe("AnalyticsMarketTab", () => {
  it("renders inventory panel without heatmap and forwards timePeriod", () => {
    render(<AnalyticsMarketTab timePeriod="month" />);
    expect(screen.getByTestId("analytics-market-tab")).toBeTruthy();
    const panel = screen.getByTestId("brokerage-inventory-panel");
    expect(panel).toBeTruthy();
    expect(panel.getAttribute("data-period")).toBe("month");
    expect(screen.queryByTestId("analytics-heatmap")).toBeNull();
  });
});
