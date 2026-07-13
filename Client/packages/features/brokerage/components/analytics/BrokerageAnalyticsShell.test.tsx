import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { beforeEach, describe, expect, it, vi } from "vitest";

import { LocalizationProvider } from "packages/contexts";

vi.mock("packages/features/brokerage/components/charts", () => ({
  AnalyticsBarChart: () => <div data-testid="analytics-bar-chart" />,
  AnalyticsDonutChart: ({ centerLabel }: { centerLabel?: string }) => (
    <div data-testid="analytics-donut-chart">{centerLabel}</div>
  ),
  AnalyticsLineChart: () => <div data-testid="analytics-line-chart" />,
  AnalyticsHeatMap: () => <div data-testid="analytics-heatmap" />,
}));

vi.mock("packages/navigation", () => ({
  Link: ({ children }: { children: React.ReactNode }) => <span>{children}</span>,
}));

vi.mock("packages/features/brokerage/components/analytics/AncillaryInsightPanel", () => ({
  AncillaryInsightPanel: ({ data }: { data: { summary: { total_leakage_dollars: number } } }) => (
    <div data-testid="ancillary-panel">leakage:{data.summary.total_leakage_dollars}</div>
  ),
}));

vi.mock("packages/features/brokerage/components/analytics/TargetedAgentEngagementPanel", () => ({
  TargetedAgentEngagementPanel: () => <div data-testid="engagement-panel" />,
}));

vi.mock("packages/features/brokerage/components/analytics/AgentRetentionRiskPanel", () => ({
  AgentRetentionRiskPanel: () => <div data-testid="retention-panel" />,
}));

vi.mock("packages/features/brokerage/components/inventory/BrokerageInventoryPanel", () => ({
  BrokerageInventoryPanel: ({ timePeriod }: { timePeriod?: string }) => (
    <div data-testid="inventory-panel" data-period={timePeriod} />
  ),
}));

import { CLOSINGS_LABEL, TREND_TITLE } from "./analyticsShellConstants";
import { BrokerageAnalyticsShell } from "./BrokerageAnalyticsShell";

function renderShell() {
  const queryClient = new QueryClient({
    defaultOptions: { queries: { retry: false } },
  });
  return render(
    <QueryClientProvider client={queryClient}>
      <LocalizationProvider>
        <BrokerageAnalyticsShell />
      </LocalizationProvider>
    </QueryClientProvider>
  );
}

describe("BrokerageAnalyticsShell", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("updates closings and trend labels when period buttons are clicked", async () => {
    const user = userEvent.setup();
    renderShell();

    expect(screen.getByText(CLOSINGS_LABEL.all)).toBeTruthy();
    expect(screen.getByText(TREND_TITLE.all)).toBeTruthy();

    await user.click(screen.getByRole("button", { name: "7D" }));
    expect(screen.getByText(CLOSINGS_LABEL.week)).toBeTruthy();
    expect(screen.getByText(TREND_TITLE.week)).toBeTruthy();

    await user.click(screen.getByRole("button", { name: "1M" }));
    expect(screen.getByText(CLOSINGS_LABEL.month)).toBeTruthy();
    expect(screen.getByText(TREND_TITLE.month)).toBeTruthy();

    await user.click(screen.getByRole("button", { name: "5Y" }));
    expect(screen.getByText(CLOSINGS_LABEL["5years"])).toBeTruthy();
    expect(screen.getByText(TREND_TITLE["5years"])).toBeTruthy();
    expect(TREND_TITLE["5years"]).toContain("5 Years");
  });

  it("switches all tabs without crashing", async () => {
    const user = userEvent.setup();
    renderShell();

    await user.click(screen.getByRole("tab", { name: "Agents" }));
    expect(screen.getByTestId("engagement-panel")).toBeTruthy();

    await user.click(screen.getByRole("tab", { name: "Leakage" }));
    expect(screen.getByTestId("ancillary-panel")).toBeTruthy();
    expect(screen.getByText("Service Revenue Mix")).toBeTruthy();

    await user.click(screen.getByRole("tab", { name: "Deal forensics" }));
    expect(screen.getByTestId("analytics-forensics-tab")).toBeTruthy();

    await user.click(screen.getByRole("tab", { name: "Market" }));
    expect(screen.getByTestId("inventory-panel")).toBeTruthy();
    expect(screen.getByRole("button", { name: "7D" })).toBeTruthy();
  });

  it("updates leakage dollars when period changes", async () => {
    const user = userEvent.setup();
    renderShell();
    await user.click(screen.getByRole("tab", { name: "Leakage" }));
    const before = screen.getByTestId("ancillary-panel").textContent;
    await user.click(screen.getByRole("button", { name: "7D" }));
    const after = screen.getByTestId("ancillary-panel").textContent;
    expect(before).toBeTruthy();
    expect(after).toBeTruthy();
    expect(after).not.toEqual(before);
  });
});
