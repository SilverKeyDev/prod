import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { render, screen } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";

vi.mock("packages/features/brokerage/components/charts", () => ({
  AnalyticsBarChart: () => <div data-testid="analytics-bar-chart" />,
  AnalyticsDonutChart: () => <div data-testid="analytics-donut-chart" />,
  AnalyticsLineChart: () => <div data-testid="analytics-line-chart" />,
}));

vi.mock("packages/features/brokerage/components/analytics/AgentRowActions", () => ({
  AgentRowActions: () => <div data-testid="agent-row-actions" />,
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
  it("renders performance gallery, leaderboard columns, and top agent", () => {
    const queryClient = new QueryClient({
      defaultOptions: { queries: { retry: false } },
    });
    render(
      <QueryClientProvider client={queryClient}>
        <AnalyticsAgentsTab timePeriod="month" />
      </QueryClientProvider>
    );

    expect(screen.getByTestId("analytics-agents-tab")).toBeTruthy();
    expect(screen.getByTestId("agent-status-donut")).toBeTruthy();
    expect(screen.getByTestId("agent-gci-bars")).toBeTruthy();
    expect(screen.getByTestId("agent-closings-trend")).toBeTruthy();
    expect(screen.getByText("Office")).toBeTruthy();
    expect(screen.getByText("Volume")).toBeTruthy();
    expect(screen.getByText("GCI")).toBeTruthy();
    expect(screen.getByText("90d momentum")).toBeTruthy();
    expect(screen.getByText("Kristina Alexander")).toBeTruthy();
    expect(screen.getAllByText("East Office").length).toBeGreaterThanOrEqual(1);
    expect(screen.getByText(/Charts and leaderboard use the full 500-agent roster/)).toBeTruthy();
  });
});
