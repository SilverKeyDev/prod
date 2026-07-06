/** Buyer financing field slugs and UI options (SIL-182). */

export const LENDER_STATUS_VALUES = ["pre_approved", "pre_qualified", "not_yet"] as const;

export type LenderStatusValue = (typeof LENDER_STATUS_VALUES)[number];

export const LOAN_TYPE_VALUES = ["conventional", "fha", "va", "not_sure"] as const;

export type LoanTypeValue = (typeof LOAN_TYPE_VALUES)[number];

export const DOWN_PAYMENT_BAND_VALUES = ["less_5", "5_10", "10_20", "20_plus", "not_sure"] as const;

export type DownPaymentBandValue = (typeof DOWN_PAYMENT_BAND_VALUES)[number];

export const FIRST_HOME_VALUES = ["yes", "no"] as const;

export type FirstHomeValue = (typeof FIRST_HOME_VALUES)[number];

export const RENT_OR_OWN_VALUES = ["rent", "own"] as const;

export type RentOrOwnValue = (typeof RENT_OR_OWN_VALUES)[number];

export const NEED_TO_SELL_FIRST_VALUES = ["yes", "no", "not_sure"] as const;

export type NeedToSellFirstValue = (typeof NEED_TO_SELL_FIRST_VALUES)[number];

export const MOVE_TIMELINE_VALUES = ["asap", "1_3_months", "3_6_months", "just_browsing"] as const;

export type MoveTimelineValue = (typeof MOVE_TIMELINE_VALUES)[number];

export const BUYER_CREDIT_SCORE_RANGE_VALUES = [
  "excellent",
  "good",
  "fair",
  "working_on_it",
  "unknown",
] as const;

export type BuyerCreditScoreRangeValue = (typeof BUYER_CREDIT_SCORE_RANGE_VALUES)[number];

export type BuyerPriceFinancingPrefs = {
  lender_status?: LenderStatusValue;
  lender_name?: string;
  want_lender_connection?: boolean;
  loan_type?: LoanTypeValue;
  down_payment_band?: DownPaymentBandValue;
  first_home?: FirstHomeValue;
  max_monthly_payment?: number;
  rent_or_own?: RentOrOwnValue;
  need_to_sell_first?: NeedToSellFirstValue;
  move_timeline?: MoveTimelineValue;
  hoa_ok?: boolean;
  hoa_fee_max_monthly?: number;
};
