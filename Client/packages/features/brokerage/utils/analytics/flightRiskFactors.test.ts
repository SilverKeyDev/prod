import { describe, expect, it } from "vitest";

import {
  blendedFlightRiskScore,
  buildFlightRiskSubfactors,
  FLIGHT_RISK_FACTOR_LABELS,
  FLIGHT_RISK_SUBFACTOR_LABELS,
  type FlightRiskFactorScores,
  isBlendedScoreConsistent,
  rankFlightRiskFactors,
  rankFlightRiskFactorsWithSubs,
  riskScoreBand,
  topFlightRiskDrivers,
} from "./flightRiskFactors";

const SAMPLE: FlightRiskFactorScores = {
  compensation: 90,
  production_momentum: 70,
  peer_standing: 80,
  engagement: 60,
  ancillary_attach: 50,
};

describe("flightRiskFactors", () => {
  it("labels all five factors", () => {
    expect(FLIGHT_RISK_FACTOR_LABELS.compensation).toBe("Comp competitiveness");
    expect(FLIGHT_RISK_FACTOR_LABELS.production_momentum).toBe("Production momentum");
    expect(FLIGHT_RISK_FACTOR_LABELS.peer_standing).toBe("Peer standing");
    expect(FLIGHT_RISK_FACTOR_LABELS.engagement).toBe("Engagement");
    expect(FLIGHT_RISK_FACTOR_LABELS.ancillary_attach).toBe("Ancillary attach");
  });

  it("blends as rounded equal-weight mean", () => {
    expect(blendedFlightRiskScore(SAMPLE)).toBe(70);
  });

  it("ranks factors highest risk first", () => {
    const ranked = rankFlightRiskFactors(SAMPLE);
    expect(ranked.map((d) => d.key)).toEqual([
      "compensation",
      "peer_standing",
      "production_momentum",
      "engagement",
      "ancillary_attach",
    ]);
  });

  it("returns top N drivers", () => {
    const top = topFlightRiskDrivers(SAMPLE, 2);
    expect(top).toHaveLength(2);
    expect(top[0]).toEqual({
      key: "compensation",
      label: "Comp competitiveness",
      score: 90,
    });
    expect(top[1].key).toBe("peer_standing");
  });

  it("checks blended score consistency", () => {
    expect(isBlendedScoreConsistent(70, SAMPLE)).toBe(true);
    expect(isBlendedScoreConsistent(71, SAMPLE)).toBe(false);
  });

  it("maps risk score bands", () => {
    expect(riskScoreBand(85)).toBe("high");
    expect(riskScoreBand(70)).toBe("high");
    expect(riskScoreBand(55)).toBe("medium");
    expect(riskScoreBand(40)).toBe("medium");
    expect(riskScoreBand(18)).toBe("low");
  });

  it("builds related subfactors with mean ≈ parent, sorted high→low", () => {
    const subs = buildFlightRiskSubfactors("AGT-0460", "compensation", 85);
    expect(subs).toHaveLength(FLIGHT_RISK_SUBFACTOR_LABELS.compensation.length);
    const mean = Math.round(subs.reduce((s, row) => s + row.score, 0) / subs.length);
    expect(mean).toBe(85);
    for (let i = 1; i < subs.length; i += 1) {
      expect(subs[i - 1]!.score).toBeGreaterThanOrEqual(subs[i]!.score);
    }
    for (const sub of subs) {
      expect(sub.score).toBeGreaterThanOrEqual(0);
      expect(sub.score).toBeLessThanOrEqual(100);
    }
  });

  it("is deterministic for the same agent + factor + parent", () => {
    const a = buildFlightRiskSubfactors("AGT-0460", "ancillary_attach", 83);
    const b = buildFlightRiskSubfactors("AGT-0460", "ancillary_attach", 83);
    expect(a).toEqual(b);
  });

  it("ranks factors with nested subfactors", () => {
    const ranked = rankFlightRiskFactorsWithSubs("AGT-0460", SAMPLE);
    expect(ranked[0]?.key).toBe("compensation");
    expect(ranked[0]?.subfactors?.length).toBe(4);
    expect(ranked.every((d) => (d.subfactors?.length ?? 0) > 0)).toBe(true);
  });
});
