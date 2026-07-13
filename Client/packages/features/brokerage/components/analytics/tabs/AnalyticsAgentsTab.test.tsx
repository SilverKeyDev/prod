import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { render, screen } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";

vi.mock("packages/features/brokerage/components/charts", () => ({
  AnalyticsBarChart: () => <div data-testid="analytics-bar-chart" />,
}));

vi.mock("packages/features/brokerage/components/analytics/TargetedAgentEngagementPanel", () => ({
  TargetedAgentEngagementPanel: () => <div data-testid="engagement-panel" />,
}));

vi.mock("packages/features/brokerage/components/analytics/AgentRetentionRiskPanel", () => ({
  AgentRetentionRiskPanel: () => <div data-testid="retention-panel" />,
}));

vi.mock("packages/features/brokerage/components/analytics/AgentRowActions", () => ({
  AgentRowActions: () => <div data-testid="agent-row-actions" />,
}));

import { AnalyticsAgentsTab } from "./AnalyticsAgentsTab";

describe("AnalyticsAgentsTab", () => {
  it("renders office, volume, GCI, and 90d momentum columns", () => {
    const queryClient = new QueryClient({
      defaultOptions: { queries: { retry: false } },
    });
    render(
      <QueryClientProvider client={queryClient}>
        <AnalyticsAgentsTab timePeriod="month" />
      </QueryClientProvider>
    );

    expect(screen.getByTestId("analytics-agents-tab")).toBeTruthy();
    expect(screen.getByText("Office")).toBeTruthy();
    expect(screen.getByText("Volume")).toBeTruthy();
    expect(screen.getByText("GCI")).toBeTruthy();
    expect(screen.getByText("90d momentum")).toBeTruthy();
    expect(screen.getAllByText("Nelson-Hardin Realty").length).toBeGreaterThanOrEqual(1);
    expect(screen.getByText("Dean Houston")).toBeTruthy();
    expect(screen.getByText("+12.4%")).toBeTruthy();
  });
});
