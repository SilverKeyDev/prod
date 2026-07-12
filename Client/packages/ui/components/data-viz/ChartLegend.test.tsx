import { render, screen } from "@testing-library/react";
import { describe, expect, it } from "vitest";

import { color } from "packages/design-tokens";

import { ChartLegend } from "./ChartLegend";

describe("ChartLegend", () => {
  it("renders swatches with label and percentage inline", () => {
    const success = color("state.success.DEFAULT");
    const chart1 = color("chart.1");
    const danger = color("state.danger.DEFAULT");

    const { container } = render(
      <ChartLegend
        className="absolute right-0 top-0"
        items={[
          { label: "Top Performer", color: success, valueLabel: "40.0%" },
          { label: "Healthy", color: chart1, valueLabel: "35.0%" },
          { label: "At Risk", color: danger },
        ]}
      />
    );

    expect(screen.getByText("Top Performer 40.0%")).toBeTruthy();
    expect(screen.getByText("Healthy 35.0%")).toBeTruthy();
    expect(screen.getByText("At Risk")).toBeTruthy();

    const swatches = container.querySelectorAll(".h-3.w-3.shrink-0.rounded-full");
    expect(swatches).toHaveLength(3);
    expect((swatches[0] as HTMLElement).style.backgroundColor).toBeTruthy();
  });
});
