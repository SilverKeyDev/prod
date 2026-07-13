import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { fireEvent, render, screen } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";

import { LocalizationProvider } from "packages/contexts";

vi.mock("echarts-for-react", () => ({
  default: () => <div data-testid="echarts-stub" />,
}));

vi.mock("packages/features/brokerage/components/charts", () => ({
  AnalyticsBarChart: ({ data }: { data: unknown[] }) => (
    <div data-testid="analytics-bar-chart">{data.length}</div>
  ),
  AnalyticsLineChart: ({ data }: { data: unknown[] }) => (
    <div data-testid="analytics-line-chart">{data.length}</div>
  ),
}));

vi.mock("packages/ui/components/structure/sidebar/SidebarNavigation", () => ({
  default: ({
    items,
    sectionTitle,
  }: {
    items: { key: string; label: string }[];
    sectionTitle?: string;
  }) => (
    <nav data-testid="campaigns-sidebar" data-section-title={sectionTitle ?? "Campaigns"}>
      {items.map((item) => (
        <button key={item.key} type="button">
          {item.label}
        </button>
      ))}
    </nav>
  ),
}));

vi.mock("packages/ui/components/structure/sidebar/TwoColumnInsetPageLayout", () => ({
  TwoColumnInsetPageLayout: ({
    sidebar,
    children,
  }: {
    sidebar: React.ReactNode;
    children: React.ReactNode;
  }) => (
    <div data-testid="two-column-layout">
      {sidebar}
      {children}
    </div>
  ),
}));

vi.mock("packages/ui/components/surfaces/modals/BaseModal", () => ({
  default: ({
    isOpen,
    title,
    children,
    footerContent,
  }: {
    isOpen: boolean;
    title?: string;
    children: React.ReactNode;
    footerContent?: React.ReactNode;
  }) =>
    isOpen ? (
      <div role="dialog" data-modal-title={title}>
        {children}
        {footerContent}
      </div>
    ) : null,
}));

vi.mock("packages/ui", async () => {
  const actual = await vi.importActual<typeof import("packages/ui")>("packages/ui");
  return {
    ...actual,
    MultiSelectDropdown: ({ label, value }: { label?: string; value: string[] }) => (
      <div data-testid="agent-type-multiselect">
        {label}: {value.join(",")}
      </div>
    ),
  };
});

import { BrokerageCampaignsShell } from "./BrokerageCampaignsShell";

function renderShell() {
  const queryClient = new QueryClient({
    defaultOptions: { queries: { retry: false } },
  });
  return render(
    <QueryClientProvider client={queryClient}>
      <LocalizationProvider>
        <BrokerageCampaignsShell />
      </LocalizationProvider>
    </QueryClientProvider>
  );
}

describe("BrokerageCampaignsShell", () => {
  it("renders sidebar and five category sections without page title", async () => {
    renderShell();
    expect(await screen.findByTestId("brokerage-campaigns-shell")).toBeTruthy();
    expect(screen.getByTestId("campaigns-sidebar")).toBeTruthy();

    expect(screen.queryByRole("heading", { level: 1, name: "Campaigns" })).toBeNull();
    expect(screen.queryByText(/A\/B email campaigns/i)).toBeNull();

    expect(screen.getByTestId("campaign-category-title_insurance")).toBeTruthy();
    expect(screen.getByTestId("campaign-category-mortgage")).toBeTruthy();
    expect(screen.getByTestId("campaign-category-homeowners_insurance")).toBeTruthy();
    expect(screen.getByTestId("campaign-category-home_warranty")).toBeTruthy();
    expect(screen.getByTestId("campaign-category-move_concierge")).toBeTruthy();

    expect(screen.getByText("Title gap: +4 pp early")).toBeTruthy();
    expect(screen.getByTestId("campaign-insights-title_insurance")).toBeTruthy();
    expect(screen.getAllByTestId("analytics-line-chart").length).toBeGreaterThanOrEqual(5);
  });

  it("renders projected recovery summary as sum of all five campaigns", async () => {
    renderShell();
    expect(await screen.findByTestId("campaign-revenue-projection-summary")).toBeTruthy();
    expect(screen.getByText("Projected recovery")).toBeTruthy();
    expect(screen.getByText("Sum of campaigns")).toBeTruthy();
    expect(screen.getByTestId("campaign-revenue-projection-total")).toBeTruthy();
    expect(screen.getByTestId("campaign-revenue-projection-breakdown")).toBeTruthy();
    expect(screen.getByTestId("campaign-revenue-projection-year-series")).toBeTruthy();
    expect(screen.getByTestId("campaign-revenue-projection-row-title_insurance")).toBeTruthy();
    expect(screen.getByTestId("campaign-revenue-projection-row-mortgage")).toBeTruthy();
    expect(screen.getByTestId("campaign-revenue-projection-row-homeowners_insurance")).toBeTruthy();
    expect(screen.getByTestId("campaign-revenue-projection-row-home_warranty")).toBeTruthy();
    expect(screen.getByTestId("campaign-revenue-projection-row-move_concierge")).toBeTruthy();

    expect(screen.getByTestId("campaign-category-year-projection-title_insurance")).toBeTruthy();
    expect(
      screen.getByTestId("campaign-category-year-projection-homeowners_insurance")
    ).toBeTruthy();
    expect(screen.getByTestId("campaign-category-year-projection-move_concierge")).toBeTruthy();
    expect(screen.getAllByText("Winner").length).toBeGreaterThanOrEqual(1);
  });

  it("adds a new variant from the create modal", async () => {
    renderShell();
    expect(await screen.findByTestId("brokerage-campaigns-shell")).toBeTruthy();

    const newVariantButtons = screen.getAllByRole("button", {
      name: "New variant",
    });
    fireEvent.click(newVariantButtons[0]!);

    expect(screen.getByTestId("create-campaign-variant-form")).toBeTruthy();

    const subjectInput = screen.getByLabelText(/Subject/i);
    const bodyInput = screen.getByLabelText(/Body/i);
    fireEvent.change(subjectInput, { target: { value: "Demo subject" } });
    fireEvent.change(bodyInput, { target: { value: "Demo body line." } });

    fireEvent.click(screen.getByRole("button", { name: "Queue" }));

    expect(await screen.findByText("Demo subject")).toBeTruthy();
    expect(screen.getByText("Queued")).toBeTruthy();
    expect(screen.getByText("Variant C")).toBeTruthy();
  });
});
