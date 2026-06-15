import type { DownPaymentBandValue } from "packages/features/profile/types/buyerFinancing";

const BAND_MIDPOINT_PERCENT: Record<DownPaymentBandValue, number> = {
  less_5: 0.025,
  "5_10": 0.075,
  "10_20": 0.15,
  "20_plus": 0.25,
  not_sure: 0.1,
};

/** Derive dollar down payment from band + budget max for affordability + user_financials. */
export function downPaymentDollarsFromBand(
  band: DownPaymentBandValue,
  homeBudgetMax: number
): number {
  const pct = BAND_MIDPOINT_PERCENT[band] ?? 0.1;
  return Math.round(homeBudgetMax * pct);
}

export function downPaymentBandMidpointPercent(band: DownPaymentBandValue): number {
  return BAND_MIDPOINT_PERCENT[band] ?? 0.1;
}
