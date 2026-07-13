import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { render, screen } from "@testing-library/react";
import type { ReactNode } from "react";
import { describe, expect, it, vi } from "vitest";

vi.mock("packages/features/brokerage/components/charts", () => ({
  AnalyticsHeatMap: () => <div data-testid="analytics-heatmap" />,
  AnalyticsBarChart: () => <div data-testid="analytics-bar-chart" />,
}));

import { TransactionActivityDistribution } from "./TransactionActivityDistribution";

function wrap(ui: ReactNode) {
  const queryClient = new QueryClient({
    defaultOptions: { queries: { retry: false } },
  });
  return render(<QueryClientProvider client={queryClient}>{ui}</QueryClientProvider>);
}

describe("TransactionActivityDistribution", () => {
  it("renders week heatmap and month/year bar charts for all period", () => {
    wrap(<TransactionActivityDistribution chartColor="#336699" period="all" />);
    expect(screen.getByTestId("transaction-activity-distribution")).toBeTruthy();
    expect(screen.getByText("Transaction Activity Distribution")).toBeTruthy();
    expect(screen.getByText("Week (day × hour)")).toBeTruthy();
    expect(screen.getByText("Month (day of month)")).toBeTruthy();
    expect(screen.getByText("Year (month of year)")).toBeTruthy();
    expect(screen.getByTestId("analytics-heatmap")).toBeTruthy();
    expect(screen.getAllByTestId("analytics-bar-chart")).toHaveLength(2);
  });

  it("shows only week heatmap for week period", () => {
    wrap(<TransactionActivityDistribution chartColor="#336699" period="week" />);
    expect(screen.getByTestId("activity-week-heatmap")).toBeTruthy();
    expect(screen.queryByTestId("activity-month-bars")).toBeNull();
    expect(screen.queryByTestId("activity-year-bars")).toBeNull();
  });

  it("shows only month bars for month period", () => {
    wrap(<TransactionActivityDistribution chartColor="#336699" period="month" />);
    expect(screen.queryByTestId("activity-week-heatmap")).toBeNull();
    expect(screen.getByTestId("activity-month-bars")).toBeTruthy();
    expect(screen.queryByTestId("activity-year-bars")).toBeNull();
  });
});
