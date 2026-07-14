/**
 * Flight-risk ML factor labels and helpers (demo / production presentation contract).
 * Blended risk_score = round(mean of the five equal-weight factor scores).
 */

export const FLIGHT_RISK_FACTOR_KEYS = [
  "compensation",
  "production_momentum",
  "peer_standing",
  "engagement",
  "ancillary_attach",
] as const;

export type FlightRiskFactorKey = (typeof FLIGHT_RISK_FACTOR_KEYS)[number];

export type FlightRiskFactorScores = Record<FlightRiskFactorKey, number>;

export const FLIGHT_RISK_FACTOR_LABELS: Record<FlightRiskFactorKey, string> = {
  compensation: "Comp competitiveness",
  production_momentum: "Production momentum",
  peer_standing: "Peer standing",
  engagement: "Engagement",
  ancillary_attach: "Ancillary attach",
};

/** Demo subfactor labels per main flight-risk factor. */
export const FLIGHT_RISK_SUBFACTOR_LABELS: Record<FlightRiskFactorKey, readonly string[]> = {
  compensation: ["Split vs market", "Tenure-adjusted split", "Peer office gap", "Cap proximity"],
  production_momentum: [
    "YoY GCI decline",
    "Closed-deal velocity",
    "Pipeline depth",
    "Days-to-close drift",
  ],
  peer_standing: [
    "Office percentile drift",
    "Tenure / agent age band",
    "Rank vs cohort",
    "GCI share of office",
  ],
  engagement: [
    "Platform login streak",
    "Campaign response rate",
    "Coaching attendance",
    "Mentorship touchpoints",
  ],
  ancillary_attach: [
    "Title attach gap",
    "Lending attach gap",
    "Warranty attach gap",
    "Escrow partner rate",
  ],
};

export type RiskScoreBand = "high" | "medium" | "low";

export type FlightRiskSubfactor = {
  label: string;
  score: number;
};

export type FlightRiskFactorDriver = {
  key: FlightRiskFactorKey;
  label: string;
  score: number;
  subfactors?: FlightRiskSubfactor[];
};

/** Same thresholds as blended score coloring in AgentDetailRetention. */
export function riskScoreBand(score: number): RiskScoreBand {
  if (score >= 70) return "high";
  if (score >= 40) return "medium";
  return "low";
}

function clampScore(value: number): number {
  return Math.max(0, Math.min(100, Math.round(value)));
}

/** Stable 0–1 hash from agentId + label for deterministic demo subscores. */
function demoHashUnit(seed: string): number {
  let hash = 2166136261;
  for (let i = 0; i < seed.length; i += 1) {
    hash ^= seed.charCodeAt(i);
    hash = Math.imul(hash, 16777619);
  }
  return (hash >>> 0) / 0xffffffff;
}

/**
 * Build demo subfactors whose rounded mean equals parentScore when possible.
 * Deterministic for a given (agentId, factorKey, parentScore).
 */
export function buildFlightRiskSubfactors(
  agentId: string,
  factorKey: FlightRiskFactorKey,
  parentScore: number
): FlightRiskSubfactor[] {
  const labels = FLIGHT_RISK_SUBFACTOR_LABELS[factorKey];
  const parent = clampScore(parentScore);
  const n = labels.length;

  // Provisional offsets in ±10; last slot reserved so mean can hit parent.
  const provisional: number[] = [];
  for (let i = 0; i < n - 1; i += 1) {
    const unit = demoHashUnit(`${agentId}:${factorKey}:${labels[i]}`);
    provisional.push(Math.round((unit - 0.5) * 20));
  }
  const sumProvisional = provisional.reduce((s, o) => s + o, 0);
  provisional.push(-sumProvisional);

  const scores = provisional.map((offset) => clampScore(parent + offset));
  // After clamp, force last score so rounded mean === parent when in range.
  const sumHead = scores.slice(0, -1).reduce((s, v) => s + v, 0);
  scores[n - 1] = clampScore(parent * n - sumHead);

  return labels
    .map((label, i) => ({ label, score: scores[i]! }))
    .sort((a, b) => b.score - a.score || a.label.localeCompare(b.label));
}

/** Sorted highest → lowest score (top risk drivers). */
export function rankFlightRiskFactors(
  factorScores: FlightRiskFactorScores
): FlightRiskFactorDriver[] {
  return FLIGHT_RISK_FACTOR_KEYS.map((key) => ({
    key,
    label: FLIGHT_RISK_FACTOR_LABELS[key],
    score: factorScores[key],
  })).sort((a, b) => b.score - a.score || a.label.localeCompare(b.label));
}

/** Ranked factors with deterministic nested demo subfactors. */
export function rankFlightRiskFactorsWithSubs(
  agentId: string,
  factorScores: FlightRiskFactorScores
): FlightRiskFactorDriver[] {
  return rankFlightRiskFactors(factorScores).map((driver) => ({
    ...driver,
    subfactors: buildFlightRiskSubfactors(agentId, driver.key, driver.score),
  }));
}

export function topFlightRiskDrivers(
  factorScores: FlightRiskFactorScores,
  count = 3
): FlightRiskFactorDriver[] {
  return rankFlightRiskFactors(factorScores).slice(0, count);
}

export function blendedFlightRiskScore(factorScores: FlightRiskFactorScores): number {
  const sum = FLIGHT_RISK_FACTOR_KEYS.reduce((s, key) => s + factorScores[key], 0);
  return Math.round(sum / FLIGHT_RISK_FACTOR_KEYS.length);
}

export function isBlendedScoreConsistent(
  riskScore: number,
  factorScores: FlightRiskFactorScores
): boolean {
  return riskScore === blendedFlightRiskScore(factorScores);
}
