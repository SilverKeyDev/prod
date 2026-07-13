import { render, screen } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";

import { color } from "packages/design-tokens";

vi.mock("echarts-for-react", () => ({
  default: () => <div data-testid="echarts-donut" />,
}));

import { AnalyticsDonutChart } from "./AnalyticsDonutChart";

describe("AnalyticsDonutChart", () => {
  it("renders a top-right ChartLegend with inline percentages", () => {
    const { container } = render(
      <AnalyticsDonutChart
        data={[
          { label: "Top Performer", value: 40 },
          { label: "Healthy", value: 35 },
          { label: "At Risk", value: 25 },
        ]}
        colors={[color("state.success.DEFAULT"), color("chart.1"), color("state.danger.DEFAULT")]}
      />
    );

    expect(screen.getByTestId("echarts-donut")).toBeTruthy();
    expect(screen.getByText("Top Performer 40.0%")).toBeTruthy();
    expect(screen.getByText("Healthy 35.0%")).toBeTruthy();
    expect(screen.getByText("At Risk 25.0%")).toBeTruthy();
    expect(container.querySelector(".absolute.top-0.right-0")).toBeTruthy();
  });
});
