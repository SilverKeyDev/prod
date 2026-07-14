/**
 * Shared attach benchmarks for Leakage + Campaigns.
 * Industry avg = campaign baselines; industry high = campaign reachable posts.
 * Brokerage current = at industry average for the demo (gap-to-avg ≈ $0).
 */
import {
  ANCILLARY_FEES,
  attachRateLiftPp,
  recoveredDollars,
} from "packages/features/brokerage/utils/ancillaryFees";

export type LeakageBenchmarkService = "title" | "lending" | "escrow" | "home_warranty";

export type AncillaryAttachBenchmark = {
  /** Brokerage current in-house attach %. */
  current: number;
  /** Industry average attach % (campaign baseline). */
  industryAvg: number;
  /** Industry / reachable high attach % (campaign post). */
  industryHigh: number;
  fee: number;
};

/**
 * Canonical attach catalog. Title/lending/warranty highs match campaignCategorySeeds posts.
 * Escrow high is +4 pp (same gap-frame pattern; no campaign row).
 */
export const ANCILLARY_ATTACH_BENCHMARKS: Record<
  LeakageBenchmarkService,
  AncillaryAttachBenchmark
> = {
  title: {
    current: 15,
    industryAvg: 15,
    industryHigh: 19,
    fee: ANCILLARY_FEES.title,
  },
  lending: {
    current: 15,
    industryAvg: 15,
    industryHigh: 18,
    fee: ANCILLARY_FEES.lending,
  },
  escrow: {
    current: 18,
    industryAvg: 18,
    industryHigh: 22,
    fee: ANCILLARY_FEES.escrow,
  },
  home_warranty: {
    current: 20,
    industryAvg: 20,
    industryHigh: 23.5,
    fee: ANCILLARY_FEES.home_warranty,
  },
};

/** Current attach rates (compat alias for existing imports). */
export const ANCILLARY_ATTACH_RATES = {
  title: ANCILLARY_ATTACH_BENCHMARKS.title.current,
  lending: ANCILLARY_ATTACH_BENCHMARKS.lending.current,
  escrow: ANCILLARY_ATTACH_BENCHMARKS.escrow.current,
  home_warranty: ANCILLARY_ATTACH_BENCHMARKS.home_warranty.current,
} as const;

export function gapToBenchmarkPp(currentPercent: number, benchmarkPercent: number): number {
  return Math.max(0, attachRateLiftPp(currentPercent, benchmarkPercent));
}

/** Incremental attaches then dollars for a gap in percentage points (brokerage volume). */
export function opportunityDollars(
  closings: number,
  currentPercent: number,
  benchmarkPercent: number,
  fee: number
): number {
  const gapPp = gapToBenchmarkPp(currentPercent, benchmarkPercent);
  const incremental = Math.round((closings * gapPp) / 100);
  return recoveredDollars(incremental, fee);
}

/**
 * Agent-scale opportunity: round dollars, not attaches (small tx counts would otherwise zero out).
 */
export function opportunityDollarsPrecise(
  closings: number,
  currentPercent: number,
  benchmarkPercent: number,
  fee: number
): number {
  const gapPp = gapToBenchmarkPp(currentPercent, benchmarkPercent);
  return Math.round((closings * gapPp * fee) / 100);
}

export function isLeakageBenchmarkService(service: string): service is LeakageBenchmarkService {
  return service in ANCILLARY_ATTACH_BENCHMARKS;
}

/**
 * Keep-rate benchmark for Transaction Fall-Off (not ancillary attach).
 * Current = industry avg; high = campaign reachable post.
 */
export const FALL_OFF_KEEP_BENCHMARK = {
  current: 72,
  industryAvg: 72,
  industryHigh: 76,
  /** Assumed brokerage GCI share per saved closing. */
  fee: 400,
} as const;

/** Period-scaled opportunity dollars for keep-rate gap to industry high. */
export function fallOffOpportunityDollars(closings: number): number {
  return opportunityDollars(
    closings,
    FALL_OFF_KEEP_BENCHMARK.current,
    FALL_OFF_KEEP_BENCHMARK.industryHigh,
    FALL_OFF_KEEP_BENCHMARK.fee
  );
}
