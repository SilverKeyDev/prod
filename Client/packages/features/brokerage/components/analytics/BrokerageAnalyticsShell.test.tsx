import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { beforeEach, describe, expect, it, vi } from "vitest";

import { LocalizationProvider } from "packages/contexts";

globalThis.ResizeObserver = class {
  observe() {}
  unobserve() {}
  disconnect() {}
};

const navState = vi.hoisted(() => ({ search: "" }));

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
  AnalyticsBarChart: () => <div data-testid="analytics-bar-chart" />,
  AnalyticsDonutChart: ({
    centerLabel,
    centerSub,
  }: {
    centerLabel?: string;
    centerSub?: string;
  }) => (
    <div data-testid="analytics-donut-chart">
      {centerLabel}
      {centerSub ? <span data-testid="donut-center-sub">{centerSub}</span> : null}
    </div>
  ),
  AnalyticsLineChart: () => <div data-testid="analytics-line-chart" />,
  AnalyticsFunnelChart: () => <div data-testid="analytics-funnel-chart" />,
  AnalyticsTreemapChart: () => <div data-testid="analytics-treemap-chart" />,
  AnalyticsHeatMap: () => <div data-testid="analytics-heatmap" />,
}));

vi.mock("packages/navigation", () => ({
  Link: ({ children, to }: { children: React.ReactNode; to: string }) => (
    <a href={to}>{children}</a>
  ),
  useNavigation: () => ({
    navigateToPath: vi.fn(),
    getSearchParams: () => new URLSearchParams(navState.search),
    setSearchParams: (
      input: URLSearchParams | Record<string, string> | ((prev: URLSearchParams) => URLSearchParams)
    ) => {
      const prev = new URLSearchParams(navState.search);
      let next: URLSearchParams;
      if (typeof input === "function") {
        next = input(prev);
      } else if (input instanceof URLSearchParams) {
        next = input;
      } else {
        next = new URLSearchParams(input);
      }
      navState.search = next.toString();
    },
  }),
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
    navState.search = "";
  });

  it("updates closings and trend labels when period buttons are clicked", async () => {
    const user = userEvent.setup();
    renderShell();

    expect(screen.getByText(CLOSINGS_LABEL.year)).toBeTruthy();
    expect(screen.getByText(TREND_TITLE.year)).toBeTruthy();
    expect(screen.getByTestId("volume-assumption-footnote")).toBeTruthy();

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

    const tabs = screen.getAllByRole("tab");
    expect(tabs.map((t) => t.textContent)).toEqual([
      "Overview",
      "Leakage",
      "Agents",
      "Deal forensics",
      "Market",
    ]);

    await user.click(screen.getByRole("tab", { name: "Leakage" }));
    expect(screen.getByTestId("leakage-section-snapshot")).toBeTruthy();
    expect(screen.getByTestId("leakage-math-strip")).toBeTruthy();
    expect(screen.getByText("Service Revenue Mix")).toBeTruthy();
    expect(navState.search).toContain("tab=leakage");

    await user.click(screen.getByRole("tab", { name: "Agents" }));
    expect(screen.getByTestId("engagement-panel")).toBeTruthy();

    await user.click(screen.getByRole("tab", { name: "Deal forensics" }));
    expect(screen.getByTestId("analytics-forensics-tab")).toBeTruthy();

    await user.click(screen.getByRole("tab", { name: "Market" }));
    expect(screen.getByTestId("inventory-panel")).toBeTruthy();
    expect(screen.getByRole("button", { name: "7D" })).toBeTruthy();
  });

  it("opens Leakage when ?tab=leakage is present", () => {
    navState.search = "tab=leakage";
    renderShell();
    expect(screen.getByTestId("leakage-section-snapshot")).toBeTruthy();
    expect(screen.getByText("Service Revenue Mix")).toBeTruthy();
  });

  it("updates leakage dollars when period changes", async () => {
    const user = userEvent.setup();
    renderShell();
    await user.click(screen.getByRole("tab", { name: "Leakage" }));
    const before = screen.getByTestId("leakage-math-strip-hero").textContent;
    await user.click(screen.getByRole("button", { name: "7D" }));
    const after = screen.getByTestId("leakage-math-strip-hero").textContent;
    expect(before).toBeTruthy();
    expect(after).toBeTruthy();
    expect(after).not.toEqual(before);
  });

  it("renders the design-system office dropdown in the header", () => {
    renderShell();
    expect(screen.getByTestId("analytics-office-dropdown")).toBeTruthy();
    expect(screen.getByTestId("analytics-office-dropdown").querySelector("button")).toBeTruthy();
  });
});
