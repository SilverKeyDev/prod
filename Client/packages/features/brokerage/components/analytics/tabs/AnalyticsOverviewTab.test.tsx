import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { render, screen } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";

vi.mock("packages/features/brokerage/components/charts", () => ({
  AnalyticsBarChart: () => <div data-testid="analytics-bar-chart" />,
  AnalyticsDonutChart: () => <div data-testid="analytics-donut-chart" />,
  AnalyticsLineChart: () => <div data-testid="analytics-line-chart" />,
}));

import { AnalyticsOverviewTab } from "./AnalyticsOverviewTab";

function renderTab(period: "month" | "week" = "month") {
  const queryClient = new QueryClient({
    defaultOptions: { queries: { retry: false } },
  });
  return render(
    <QueryClientProvider client={queryClient}>
      <AnalyticsOverviewTab timePeriod={period} />
    </QueryClientProvider>
  );
}

describe("AnalyticsOverviewTab", () => {
  it("renders titled overview sections", () => {
    renderTab();

    expect(screen.getByTestId("analytics-overview-tab")).toBeTruthy();
    expect(screen.getByTestId("overview-section-snapshot")).toBeTruthy();
    expect(screen.getByTestId("overview-section-production")).toBeTruthy();
    expect(screen.getByTestId("overview-section-pipeline")).toBeTruthy();
    expect(screen.getByTestId("overview-section-mix")).toBeTruthy();
    expect(screen.getByTestId("overview-section-closings")).toBeTruthy();
    expect(screen.getByRole("heading", { name: "Snapshot" })).toBeTruthy();
    expect(screen.getByRole("heading", { name: "Production" })).toBeTruthy();
    expect(screen.getByRole("heading", { name: "Pipeline" })).toBeTruthy();
    expect(screen.getByRole("heading", { name: "Mix" })).toBeTruthy();
    expect(screen.getByRole("heading", { name: "Closings" })).toBeTruthy();
  });

  it("renders property class and representation side sections", () => {
    renderTab();

    expect(screen.getByTestId("analytics-overview-tab")).toBeTruthy();
    expect(screen.getByText("Property Class")).toBeTruthy();
    expect(screen.getByText("Representation Side")).toBeTruthy();
    expect(screen.getAllByTestId("analytics-donut-chart").length).toBeGreaterThanOrEqual(2);
  });

  it("renders Tier 1 production KPIs, goals pacing, volume by status, and office rollup", () => {
    renderTab();

    expect(screen.getByTestId("production-kpi-row")).toBeTruthy();
    expect(screen.getByText("Closed volume")).toBeTruthy();
    expect(screen.getByText("Goals & pacing")).toBeTruthy();
    expect(screen.getByTestId("goals-pacing")).toBeTruthy();
    expect(screen.getByTestId("office-production-table")).toBeTruthy();
  });
});
