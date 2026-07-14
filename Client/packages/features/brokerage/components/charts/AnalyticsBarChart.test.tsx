import { render, screen } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";

vi.mock("echarts-for-react", () => ({
  default: ({
    option,
  }: {
    option: { series?: { name?: string; type?: string }[]; legend?: { data?: string[] } };
  }) => (
    <div
      data-testid="echarts-bar"
      data-series-count={String(option.series?.length ?? 0)}
      data-legend={JSON.stringify(option.legend?.data ?? [])}
      data-series-names={JSON.stringify(option.series?.map((s) => s.name) ?? [])}
    />
  ),
}));

import { AnalyticsBarChart } from "./AnalyticsBarChart";

describe("AnalyticsBarChart grouped series", () => {
  it("renders one bar series per named series with a legend", () => {
    render(
      <AnalyticsBarChart
        data={[
          { label: "Closings", value: 0 },
          { label: "GCI", value: 0 },
        ]}
        orientation="vertical"
        series={[
          { name: "This Agent", values: [12, 80], color: "#111" },
          { name: "Brokerage Avg", values: [8, 60], color: "#999" },
        ]}
      />
    );

    const chart = screen.getByTestId("echarts-bar");
    expect(chart.getAttribute("data-series-count")).toBe("2");
    expect(JSON.parse(chart.getAttribute("data-legend") ?? "[]")).toEqual([
      "This Agent",
      "Brokerage Avg",
    ]);
  });
});
