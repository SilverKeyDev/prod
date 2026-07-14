import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { fireEvent, render, screen } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";

import { LocalizationProvider } from "packages/contexts";

vi.mock("packages/navigation", () => ({
  Link: ({ children, to }: { children: React.ReactNode; to: string }) => (
    <a href={to}>{children}</a>
  ),
  useNavigation: () => ({ navigateToPath: vi.fn() }),
}));

vi.mock("packages/email-templates", () => ({
  renderCampaignAgentEmailHtml: async () =>
    "<!DOCTYPE html><html><body><p>Mock campaign email</p></body></html>",
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
    footerContent,
  }: {
    items: { key: string; label: string }[];
    sectionTitle?: string;
    footerContent?: React.ReactNode;
  }) => (
    <nav data-testid="campaigns-sidebar" data-section-title={sectionTitle ?? "Campaigns"}>
      {items.map((item) => (
        <button key={item.key} type="button">
          {item.label}
        </button>
      ))}
      {footerContent}
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
  it("renders sidebar and six category sections without page title", async () => {
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
    expect(screen.getByTestId("campaign-category-transaction_fall_off")).toBeTruthy();

    expect(screen.getByText("Title gap: +4 pp early")).toBeTruthy();
    expect(screen.getByText("48-hour form SLA: protect keep-rate")).toBeTruthy();
    expect(screen.queryByTestId("campaign-insights-title_insurance")).toBeNull();
    expect(screen.queryByText("What worked")).toBeNull();
    expect(screen.queryByText("Variant A")).toBeNull();
    expect(screen.getByLabelText("Title Insurance email variants")).toBeTruthy();
    expect(await screen.findByTestId("campaign-email-preview-title-email-b")).toBeTruthy();
    expect(screen.queryByTestId("campaign-email-charts-title-email-b")).toBeNull();

    expect(screen.getByTestId("campaign-variant-chart-attach-title_insurance")).toBeTruthy();
    expect(screen.getByTestId("campaign-variant-chart-open-title_insurance")).toBeTruthy();
    expect(screen.getByTestId("campaign-variant-chart-click-title_insurance")).toBeTruthy();
    expect(screen.getByTestId("campaign-variant-charts-mortgage")).toBeTruthy();

    // 6 categories × 3 comparison charts + 1 portfolio cumulative chart = 19
    expect(screen.getAllByTestId("analytics-line-chart")).toHaveLength(19);
  });

  it("renders projected recovery summary with worked math strip", async () => {
    renderShell();
    expect(await screen.findByTestId("campaign-revenue-projection-summary")).toBeTruthy();
    expect(screen.getByTestId("campaign-math-strip")).toBeTruthy();
    expect(screen.getByText("Projected recovery (12 months)")).toBeTruthy();
    expect(screen.getByTestId("campaign-math-strip-formula")).toBeTruthy();
    expect(screen.queryByTestId("campaign-math-strip-methodology-body")).toBeNull();
    fireEvent.click(screen.getByRole("button", { name: "Show methodology" }));
    expect(screen.getByTestId("campaign-math-strip-methodology-body")).toBeTruthy();
    expect(screen.getByTestId("campaign-math-strip-stats")).toBeTruthy();
    expect(screen.getByText(/\$\/agent\/year recovered/i)).toBeTruthy();
    expect(screen.getByText(/Year closings/i)).toBeTruthy();
    expect(screen.getByText(/National-scale demo brokerage/i)).toBeTruthy();
    expect(screen.getByTestId("campaigns-section-hero")).toBeTruthy();
    expect(screen.getByTestId("campaign-suggested-next-title_insurance")).toBeTruthy();
    expect(screen.getByTestId("campaign-status-title_insurance")).toBeTruthy();
    expect(screen.getByTestId("campaign-math-strip-bridge")).toBeTruthy();
    expect(screen.getByTestId("campaign-revenue-projection-year-series")).toBeTruthy();

    expect(screen.getByTestId("campaign-category-year-projection-title_insurance")).toBeTruthy();
    expect(
      screen.getByTestId("campaign-category-year-projection-homeowners_insurance")
    ).toBeTruthy();
    expect(screen.getByTestId("campaign-category-year-projection-move_concierge")).toBeTruthy();
    expect(
      screen.getByTestId("campaign-category-year-projection-transaction_fall_off")
    ).toBeTruthy();
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
    expect(screen.queryByText("Variant E")).toBeNull();
  });

  it("opens New campaign modal and creates a custom campaign", async () => {
    renderShell();
    expect(await screen.findByTestId("brokerage-campaigns-shell")).toBeTruthy();

    fireEvent.click(screen.getByRole("button", { name: "New campaign" }));
    expect(screen.getByTestId("create-campaign-modal")).toBeTruthy();
    expect(screen.getByTestId("campaign-template-list")).toBeTruthy();
    expect(screen.getByTestId("campaign-template-transaction_fall_off")).toBeTruthy();

    const nameInput = screen.getByLabelText(/^Name/i);
    fireEvent.change(nameInput, { target: { value: "Inspection Chase" } });
    fireEvent.click(screen.getByRole("button", { name: "Create custom" }));

    expect(await screen.findByText("Campaign added")).toBeTruthy();
    expect(screen.getByRole("heading", { level: 2, name: "Inspection Chase" })).toBeTruthy();
  });

  it("opens a full email preview from Open", async () => {
    renderShell();
    expect(await screen.findByTestId("brokerage-campaigns-shell")).toBeTruthy();

    const openWrap = screen.getByTestId("campaign-email-open-title-email-b");
    fireEvent.click(openWrap.querySelector("button")!);
    expect(await screen.findByTestId("campaign-email-preview-modal")).toBeTruthy();
    expect(screen.getByTestId("campaign-email-full-preview-title-email-b")).toBeTruthy();
    expect(screen.getByRole("dialog")).toBeTruthy();
  });

  it("edits an existing variant and saves content", async () => {
    renderShell();
    expect(await screen.findByTestId("brokerage-campaigns-shell")).toBeTruthy();

    const editWrap = screen.getByTestId("campaign-email-edit-title-email-a");
    fireEvent.click(editWrap.querySelector("button")!);
    expect(await screen.findByTestId("edit-campaign-variant-form")).toBeTruthy();

    const subjectInput = screen.getByLabelText(/Subject/i);
    const bodyInput = screen.getByLabelText(/Body/i);
    fireEvent.change(subjectInput, { target: { value: "Edited title subject" } });
    fireEvent.change(bodyInput, { target: { value: "Edited body for title A." } });
    fireEvent.click(screen.getByRole("button", { name: "Save" }));

    expect(await screen.findByText("Variant updated")).toBeTruthy();
    expect(screen.getByText("Edited title subject")).toBeTruthy();
  });

  it("opens campaign settings and saves status and cadence updates", async () => {
    renderShell();
    expect(await screen.findByTestId("brokerage-campaigns-shell")).toBeTruthy();

    const settingsWrap = screen.getByTestId("campaign-settings-title_insurance");
    fireEvent.click(settingsWrap.querySelector("button")!);
    expect(await screen.findByTestId("campaign-settings-modal")).toBeTruthy();

    const statusSelect = screen.getByLabelText(/^Status/i);
    fireEvent.change(statusSelect, { target: { value: "paused" } });
    const cadenceSelect = screen.getByLabelText(/^Cadence/i);
    fireEvent.change(cadenceSelect, { target: { value: "monthly" } });

    fireEvent.click(screen.getByRole("button", { name: "Save settings" }));

    expect(await screen.findByText("Settings updated")).toBeTruthy();
    expect(screen.getByTestId("campaign-status-title_insurance").textContent).toMatch(/Paused/i);
    expect(screen.getByTestId("campaign-window-title_insurance").textContent).toMatch(
      /monthly cadence/i
    );
  });
});
