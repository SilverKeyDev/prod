/**
 * Quant-style math explanation payloads for Leakage and Campaigns strips.
 */
export type QuantMathStat = {
  label: string;
  value: string;
};

export type QuantMathHero = {
  label: string;
  value: string;
  /** Optional CSS color for the hero value (e.g. danger / gold). */
  valueColor?: string;
  /** Secondary line under the hero (e.g. vs industry average). */
  secondaryLabel?: string;
  secondaryValue?: string;
};

export type QuantMathBridge = {
  label: string;
  to: string;
};

export type QuantMathFormulaRow = {
  label: string;
  /** e.g. "+4.00 pp × 1,854 closings × $150/attach = $11.1K" */
  equation: string;
  /** e.g. "13% current · 15% avg · 19% high · 1,854 closings" */
  inputs?: string;
};

/** Money-first KPI row set for Leakage Snapshot (optional on explanation). */
export type LeakageSnapshotKpis = {
  opportunityToHigh: string;
  vsIndustryAvg: string;
  biggestLeak: string;
  closingsInPeriod: string;
  behindIndustryAvg: boolean;
};

export type QuantMathExplanation = {
  hero: QuantMathHero;
  formulaRows: QuantMathFormulaRow[];
  formulaTotal?: string;
  stats: QuantMathStat[];
  bridge: QuantMathBridge;
  /** Present on Leakage explanations; used by Snapshot KPIs. */
  snapshot?: LeakageSnapshotKpis;
};
