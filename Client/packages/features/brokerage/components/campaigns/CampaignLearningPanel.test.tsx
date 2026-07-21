import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { render, screen } from "@testing-library/react";
import { beforeEach, describe, expect, it, vi } from "vitest";

vi.mock("echarts-for-react", () => ({
  default: () => <div data-testid="echarts-stub" />,
}));

vi.mock("packages/features/brokerage/components/charts", () => ({
  AnalyticsBarChart: ({ data }: { data: unknown[] }) => (
    <div data-testid="analytics-bar-chart">{data.length}</div>
  ),
}));

const listCampaigns = vi.fn();
const getResults = vi.fn();
const getLearning = vi.fn();
const runLearningLoop = vi.fn();

vi.mock("packages/features/brokerage/api/campaignAnalytics", () => ({
  campaignAnalyticsApi: {
    demoBrokerageOrgId: "a0000000-0000-4000-8000-000000000001",
    listCampaigns: (...args: unknown[]) => listCampaigns(...args),
    getResults: (...args: unknown[]) => getResults(...args),
    getLearning: (...args: unknown[]) => getLearning(...args),
    runLearningLoop: (...args: unknown[]) => runLearningLoop(...args),
  },
}));

vi.mock("packages/features/brokerage/hooks/useBrokerageOrgId", () => ({
  useBrokerageOrgId: () => "a0000000-0000-4000-8000-000000000001",
}));

import { CampaignLearningPanel } from "./CampaignLearningPanel";

function renderPanel() {
  const queryClient = new QueryClient({
    defaultOptions: { queries: { retry: false }, mutations: { retry: false } },
  });
  return render(
    <QueryClientProvider client={queryClient}>
      <CampaignLearningPanel />
    </QueryClientProvider>
  );
}

describe("CampaignLearningPanel", () => {
  beforeEach(() => {
    listCampaigns.mockReset();
    getResults.mockReset();
    getLearning.mockReset();
    runLearningLoop.mockReset();

    listCampaigns.mockResolvedValue({
      success: true,
      campaigns: [
        {
          id: "camp-a",
          name: "Title attach Q1",
          has_learning_result: false,
        },
        {
          id: "camp-b",
          name: "Home warranty Q2",
          has_learning_result: false,
        },
      ],
    });
    getResults.mockResolvedValue({
      success: true,
      campaign_id: "camp-a",
      name: "Title attach Q1",
      attach_rate_lift_pp: 4.2,
      recovered_dollars_total: 12000,
      funnel_by_variant: {
        A: { sent: 40, opened: 20, clicked: 10, attached: 4 },
        B: { sent: 40, opened: 28, clicked: 16, attached: 12 },
      },
      variants: [{ variant_key: "B", is_winner: true }],
      learning: null,
    });
    getLearning.mockResolvedValue({ success: true, learning: null });
  });

  it("renders the learning loop controls and results funnel", async () => {
    renderPanel();
    expect(await screen.findByTestId("campaign-learning-panel")).toBeTruthy();
    expect(screen.getByRole("heading", { level: 2, name: "Learning loop" })).toBeTruthy();
    expect(screen.getByRole("button", { name: "Run learning loop" })).toBeTruthy();
    expect(screen.getByRole("button", { name: "Run offline fallback" })).toBeTruthy();
    expect(await screen.findByTestId("campaign-learning-results")).toBeTruthy();
    expect(screen.getByText("+4.20 pp")).toBeTruthy();
    expect(screen.getByText("$12K")).toBeTruthy();
    expect(screen.getByTestId("campaign-learning-empty")).toBeTruthy();
  });
});
