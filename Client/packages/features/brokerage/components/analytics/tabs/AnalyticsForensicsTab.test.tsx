import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { render, screen } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";

vi.mock("packages/features/brokerage/components/charts", () => ({
  AnalyticsBarChart: () => <div data-testid="analytics-bar-chart" />,
  AnalyticsLineChart: () => <div data-testid="analytics-line-chart" />,
}));

vi.mock("../TransactionActivityDistribution", () => ({
  TransactionActivityDistribution: () => <div data-testid="activity-distribution" />,
}));

import { AnalyticsForensicsTab } from "./AnalyticsForensicsTab";

describe("AnalyticsForensicsTab", () => {
  it("renders contract-to-close cycle time and milestone dwell", () => {
    const queryClient = new QueryClient({
      defaultOptions: { queries: { retry: false } },
    });
    render(
      <QueryClientProvider client={queryClient}>
        <AnalyticsForensicsTab timePeriod="all" />
      </QueryClientProvider>
    );

    expect(screen.getByTestId("analytics-forensics-tab")).toBeTruthy();
    expect(screen.getByText("Contract-to-close")).toBeTruthy();
    expect(screen.getByTestId("cycle-time-kpis")).toBeTruthy();
    expect(screen.getByText("Avg contract-to-close")).toBeTruthy();
    expect(screen.getByText("38 days")).toBeTruthy();
    expect(screen.getByText("34 days")).toBeTruthy();
    expect(screen.getByText("Time in milestone (avg days)")).toBeTruthy();
  });
});
