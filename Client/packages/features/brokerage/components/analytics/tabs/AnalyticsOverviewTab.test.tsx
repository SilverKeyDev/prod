import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { render, screen } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";

vi.mock("packages/features/brokerage/components/charts", () => ({
  AnalyticsBarChart: () => <div data-testid="analytics-bar-chart" />,
  AnalyticsDonutChart: () => <div data-testid="analytics-donut-chart" />,
  AnalyticsFunnelChart: () => <div data-testid="analytics-funnel-chart" />,
  AnalyticsLineChart: () => <div data-testid="analytics-line-chart" />,
}));

vi.mock("packages/navigation", () => ({
  Link: ({ children, to }: { children: React.ReactNode; to: string }) => (
    <a href={to}>{children}</a>
  ),
}));

vi.mock("framer-motion", () => ({
  motion: {
    div: ({
      children,
      className,
      ...rest
    }: {
      children?: React.ReactNode;
      className?: string;
      "data-testid"?: string;
    }) => (
      <div className={className} data-testid={rest["data-testid"]}>
        {children}
      </div>
    ),
  },
  useReducedMotion: () => true,
}));

import { AnalyticsOverviewTab } from "./AnalyticsOverviewTab";

function renderTab(period: "month" | "week" | "year" = "month") {
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
  it("leads with snapshot then ancillary opportunity then goals", () => {
    renderTab();

    expect(screen.getByTestId("overview-section-ancillary")).toBeTruthy();
    expect(screen.getByRole("heading", { name: "Ancillary opportunity" })).toBeTruthy();
    expect(screen.getByTestId("overview-ancillary-teaser")).toBeTruthy();

    const snapshot = screen.getByTestId("overview-section-snapshot");
    const ancillary = screen.getByTestId("overview-section-ancillary");
    const goals = screen.getByTestId("goals-pacing");
    const production = screen.getByTestId("overview-section-production");

    expect(
      snapshot.compareDocumentPosition(ancillary) & Node.DOCUMENT_POSITION_FOLLOWING
    ).toBeTruthy();
    expect(
      ancillary.compareDocumentPosition(goals) & Node.DOCUMENT_POSITION_FOLLOWING
    ).toBeTruthy();
    expect(
      goals.compareDocumentPosition(production) & Node.DOCUMENT_POSITION_FOLLOWING
    ).toBeTruthy();
  });

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

  it("renders agents-by-closings density curve in Snapshot", () => {
    renderTab();

    const snapshot = screen.getByTestId("overview-section-snapshot");
    const densityWrap = screen.getByTestId("overview-snapshot-closings-density");
    expect(snapshot.contains(densityWrap)).toBe(true);
    expect(densityWrap.querySelector('[data-testid="analytics-line-chart"]')).toBeTruthy();
    expect(screen.getByRole("heading", { name: "Agents by closings / year" })).toBeTruthy();
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
    expect(screen.getAllByTestId("pace-kpi-card").length).toBe(3);
    expect(screen.getByTestId("office-production-table")).toBeTruthy();
  });

  it("scopes KPIs and shows banner when officeId is set", () => {
    const queryClient = new QueryClient({
      defaultOptions: { queries: { retry: false } },
    });
    render(
      <QueryClientProvider client={queryClient}>
        <AnalyticsOverviewTab timePeriod="month" officeId="Nelson-Hardin Realty" />
      </QueryClientProvider>
    );

    expect(screen.getByTestId("overview-office-scope").textContent).toContain("Nelson-Hardin");
    expect(screen.getByTestId("office-production-table").textContent).toContain(
      "Nelson-Hardin Realty"
    );
    expect(screen.getByTestId("office-production-table").textContent).not.toContain(
      "Banks Inc Realty"
    );
  });
});
