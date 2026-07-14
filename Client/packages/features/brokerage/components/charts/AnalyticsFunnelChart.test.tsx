import { render, screen } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";

vi.mock("echarts-for-react", () => ({
  default: ({ option }: { option: { series?: { type?: string; data?: unknown[] }[] } }) => (
    <div
      data-testid="echarts-funnel"
      data-series-type={option.series?.[0]?.type ?? ""}
      data-point-count={String(option.series?.[0]?.data?.length ?? 0)}
    />
  ),
}));

import { AnalyticsFunnelChart } from "./AnalyticsFunnelChart";

describe("AnalyticsFunnelChart", () => {
  it("renders an ECharts funnel with one point per stage", () => {
    render(
      <AnalyticsFunnelChart
        data={[
          { label: "Search", value: 100 },
          { label: "Tour", value: 80, dataLabel: "80%" },
          { label: "Offer", value: 40, dataLabel: "50%" },
        ]}
        height={200}
      />
    );

    const chart = screen.getByTestId("echarts-funnel");
    expect(chart.getAttribute("data-series-type")).toBe("funnel");
    expect(chart.getAttribute("data-point-count")).toBe("3");
  });
});
