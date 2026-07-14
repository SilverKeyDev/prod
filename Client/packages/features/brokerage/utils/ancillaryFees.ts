/**
 * Shared ancillary fee catalog for leakage analytics and campaign attribution.
 * Keep in sync with Server/app/services/brokerage/ancillary_fees.py
 *
 * Dollars = assumed brokerage placement share per in-house attach (or outside leakage).
 * Not consumer premiums and not RESPA referral fees.
 */

export const ANCILLARY_FEE_DISCLAIMER =
  "Assumed brokerage placement share per attach (not a referral fee).";

export const ANCILLARY_FEES = {
  title: 150,
  lending: 250,
  escrow: 100,
  home_warranty: 75,
  mortgage_insurance: 50,
  homeowners_insurance: 50,
  move_concierge: 40,
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
