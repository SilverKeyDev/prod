/**
 * Shared ancillary fee catalog for leakage analytics and campaign attribution.
 * Keep in sync with Server/app/services/brokerage/ancillary_fees.py
 */

export const ANCILLARY_FEES = {
  title: 500,
  lending: 1000,
  escrow: 400,
  home_warranty: 150,
  mortgage_insurance: 200,
} as const;

export type AncillaryServiceKey = keyof typeof ANCILLARY_FEES;

/** Primary services shown on Leakage / Campaigns by-service breakdowns. */
export const ANCILLARY_SERVICE_ORDER = [
  "title",
  "lending",
  "escrow",
  "home_warranty",
] as const satisfies readonly AncillaryServiceKey[];

export function feeForService(service: AncillaryServiceKey): number {
  return ANCILLARY_FEES[service];
}

export function attachRateLiftPp(baselinePercent: number, postPercent: number): number {
  return Math.round((postPercent - baselinePercent) * 100) / 100;
}

export function recoveredDollars(attributedAttaches: number, feeAssumption: number): number {
  return attributedAttaches * feeAssumption;
}
