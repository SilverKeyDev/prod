import { describe, expect, it } from "vitest";

import {
  ANCILLARY_ATTACH_BENCHMARKS,
  opportunityDollarsPrecise,
} from "packages/features/brokerage/utils/ancillaryAttachBenchmarks";
import { ANCILLARY_FEES } from "packages/features/brokerage/utils/ancillaryFees";

import { buildAncillaryData } from "./ancillaryTransforms";

/** Gap to industry avg (title + lending), agent-scale precise dollars. */
function expectedOpportunityVsAvg(
  transactions: number,
  titleAttach: number,
  lendingAttach: number
): number {
  return (
    opportunityDollarsPrecise(
      transactions,
      titleAttach,
      ANCILLARY_ATTACH_BENCHMARKS.title.industryAvg,
      ANCILLARY_FEES.title
    ) +
    opportunityDollarsPrecise(
      transactions,
      lendingAttach,
      ANCILLARY_ATTACH_BENCHMARKS.lending.industryAvg,
      ANCILLARY_FEES.lending
    )
  );
}

describe("buildAncillaryData agent Total opportunity", () => {
  it("computes month Total opportunity from attach gap vs industry avg (not high, not rounded attaches)", () => {
    const month = buildAncillaryData("month");
    const sara = month.by_agent.find((a) => a.agent_id === "AGT-0323");
    expect(sara).toBeDefined();
    // 4 tx · title 9%→15% · lending 7%→15% — must be non-zero on month scale
    expect(sara!.total_leakage_dollars).toBe(
      expectedOpportunityVsAvg(sara!.transactions, sara!.title_attach, sara!.lending_attach)
    );
    expect(sara!.total_leakage_dollars).toBe(116);
  });

  it("ranks agents by opportunity vs avg: lower attach → higher dollars at same volume", () => {
    const month = buildAncillaryData("month");
    const sara = month.by_agent.find((a) => a.agent_id === "AGT-0323")!; // 9% / 7%
    const janet = month.by_agent.find((a) => a.agent_id === "AGT-0014")!; // 24% / 28% above avg
    expect(sara.total_leakage_dollars).toBeGreaterThan(janet.total_leakage_dollars);
    expect(janet.total_leakage_dollars).toBe(0);
  });
});
