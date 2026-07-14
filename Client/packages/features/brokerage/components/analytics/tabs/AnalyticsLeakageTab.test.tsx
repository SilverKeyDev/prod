import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { describe, expect, it, vi } from "vitest";

globalThis.ResizeObserver = class {
  observe() {}
  unobserve() {}
  disconnect() {}
};

vi.mock("echarts-for-react", () => ({
  default: () => <div data-testid="echarts-stub" />,
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

vi.mock("packages/features/brokerage/components/charts", () => ({
  AnalyticsDonutChart: ({ centerSub }: { centerSub?: string }) => (
    <div data-testid="analytics-donut-chart">
      {centerSub ? <span data-testid="donut-center-sub">{centerSub}</span> : null}
    </div>
  ),
  AnalyticsBarChart: () => <div data-testid="analytics-bar-chart" />,
  AnalyticsLineChart: () => <div data-testid="analytics-line-chart" />,
}));

vi.mock("packages/navigation", () => ({
  Link: ({ children, to }: { children: React.ReactNode; to: string }) => (
    <a href={to}>{children}</a>
  ),
  useNavigation: () => ({
    navigateToPath: vi.fn(),
    getSearchParams: () => new URLSearchParams(),
    setSearchParams: vi.fn(),
  }),
}));

import { AnalyticsLeakageTab } from "./AnalyticsLeakageTab";

function renderTab(period: "month" | "week" | "year" = "month", officeId: string | null = null) {
  const queryClient = new QueryClient({
    defaultOptions: { queries: { retry: false } },
  });
  return render(
    <QueryClientProvider client={queryClient}>
      <AnalyticsLeakageTab timePeriod={period} officeId={officeId} />
    </QueryClientProvider>
  );
}

describe("AnalyticsLeakageTab", () => {
  it("renders money-first snapshot KPIs and math strip without duplicate stats", () => {
    renderTab();

    expect(screen.getByTestId("leakage-section-snapshot")).toBeTruthy();
    expect(screen.getByTestId("leakage-section-opportunity")).toBeTruthy();
    expect(screen.getByTestId("leakage-section-capture-mix")).toBeTruthy();
    expect(screen.getByTestId("leakage-section-agents")).toBeTruthy();

    expect(screen.getByRole("heading", { name: "Snapshot" })).toBeTruthy();
    expect(screen.getByRole("heading", { name: "Opportunity" })).toBeTruthy();
    expect(screen.getByRole("heading", { name: "Capture mix" })).toBeTruthy();
    expect(screen.getByRole("heading", { name: "Agents" })).toBeTruthy();

    const snapshot = screen.getByTestId("leakage-section-snapshot");
    expect(snapshot.textContent).toContain("Opportunity to high");
    expect(snapshot.textContent).toContain("vs industry avg");
    expect(snapshot.textContent).toContain("Biggest leak");
    expect(snapshot.textContent).toContain("Closings in period");

    expect(screen.getByTestId("leakage-math-strip")).toBeTruthy();
    expect(screen.queryByTestId("leakage-math-strip-stats")).toBeNull();
  });

  it("collapses methodology by default and toggles open", async () => {
    const user = userEvent.setup();
    renderTab();

    expect(screen.queryByTestId("leakage-math-strip-methodology-body")).toBeNull();
    await user.click(screen.getByRole("button", { name: "Show methodology" }));
    expect(screen.getByTestId("leakage-math-strip-methodology-body")).toBeTruthy();
    await user.click(screen.getByRole("button", { name: "Hide methodology" }));
    expect(screen.queryByTestId("leakage-math-strip-methodology-body")).toBeNull();
  });

  it("uses full opportunity label on the revenue mix donut", () => {
    renderTab();
    expect(screen.getByTestId("donut-center-sub").textContent).toBe("Opportunity to industry high");
  });

  it("shows friendly office scope when filtered", () => {
    renderTab("month", "Nelson-Hardin Realty");
    expect(screen.getByTestId("leakage-office-scope").textContent).toContain(
      "Nelson-Hardin Realty"
    );
  });
});
