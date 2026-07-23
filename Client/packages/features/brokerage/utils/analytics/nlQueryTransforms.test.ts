import { describe, expect, it } from "vitest";

import { buildNlTableColumns, selectNlBarSeries } from "./nlQueryTransforms";

describe("nlQueryTransforms", () => {
  it("builds table columns", () => {
    const cols = buildNlTableColumns(["agent_id", "closed_count"]);
    expect(cols).toHaveLength(2);
    expect(cols[0]?.render({ agent_id: "a1", closed_count: 2 })).toBe("a1");
  });

  it("builds bar series for viz_hint=bar", () => {
    const bars = selectNlBarSeries({
      viz_hint: "bar",
      columns: ["agent_id", "closed_count"],
      rows: [
        { agent_id: "agent-a", closed_count: 2 },
        { agent_id: "agent-b", closed_count: 1 },
      ],
    });
    expect(bars).toEqual([
      { label: "agent-a", value: 2 },
      { label: "agent-b", value: 1 },
    ]);
  });

  it("returns null when viz_hint is table", () => {
    expect(
      selectNlBarSeries({
        viz_hint: "table",
        columns: ["agent_id", "closed_count"],
        rows: [{ agent_id: "a", closed_count: 1 }],
      })
    ).toBeNull();
  });
});
