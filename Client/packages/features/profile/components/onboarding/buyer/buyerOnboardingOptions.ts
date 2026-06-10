/** Translation key paths for buyer onboarding option labels. */

export const BUYER_MOVING_WITH_OPTIONS = [
  { value: "just_me", labelKey: "profile.onboarding.about.moving_with.just_me" },
  { value: "partner", labelKey: "profile.onboarding.about.moving_with.partner" },
  { value: "kids", labelKey: "profile.onboarding.about.moving_with.kids" },
  { value: "other_family", labelKey: "profile.onboarding.about.moving_with.other_family" },
  { value: "roommates", labelKey: "profile.onboarding.about.moving_with.roommates" },
] as const;

export const BUYER_PET_TYPE_OPTIONS = [
  { value: "dog", labelKey: "profile.onboarding.about.pet_types.dog" },
  { value: "cat", labelKey: "profile.onboarding.about.pet_types.cat" },
  { value: "other", labelKey: "profile.onboarding.about.pet_types.other" },
] as const;

export const BUYER_PETS_YES_NO_OPTIONS = [
  { value: "yes", labelKey: "profile.onboarding.about.pets.yes" },
  { value: "no", labelKey: "profile.onboarding.about.pets.no" },
] as const;

export const LENDER_STATUS_OPTIONS = [
  {
    value: "pre_approved",
    labelKey: "profile.onboarding.financing.lender_status.pre_approved",
  },
  {
    value: "pre_qualified",
    labelKey: "profile.onboarding.financing.lender_status.pre_qualified",
  },
  { value: "not_yet", labelKey: "profile.onboarding.financing.lender_status.not_yet" },
] as const;

export const PAYMENT_METHOD_OPTIONS = [
  { value: "financing", labelKey: "profile.onboarding.financing.payment_method.financing" },
  { value: "cash", labelKey: "profile.onboarding.financing.payment_method.cash" },
] as const;

export const LOAN_TYPE_OPTIONS = [
  { value: "conventional", labelKey: "profile.onboarding.financing.loan_type.conventional" },
  { value: "fha", labelKey: "profile.onboarding.financing.loan_type.fha" },
  { value: "va", labelKey: "profile.onboarding.financing.loan_type.va" },
  { value: "not_sure", labelKey: "profile.onboarding.financing.loan_type.not_sure" },
] as const;

export const DOWN_PAYMENT_BAND_OPTIONS = [
  { value: "less_5", labelKey: "profile.onboarding.financing.down_payment_band.less_5" },
  { value: "5_10", labelKey: "profile.onboarding.financing.down_payment_band.5_10" },
  { value: "10_20", labelKey: "profile.onboarding.financing.down_payment_band.10_20" },
  { value: "20_plus", labelKey: "profile.onboarding.financing.down_payment_band.20_plus" },
  { value: "not_sure", labelKey: "profile.onboarding.financing.down_payment_band.not_sure" },
] as const;

export const FIRST_HOME_OPTIONS = [
  { value: "yes", labelKey: "profile.onboarding.financing.first_home.yes" },
  { value: "no", labelKey: "profile.onboarding.financing.first_home.no" },
] as const;

export const BUYER_CREDIT_OPTIONS = [
  { value: "excellent", labelKey: "profile.onboarding.financing.credit.excellent" },
  { value: "good", labelKey: "profile.onboarding.financing.credit.good" },
  { value: "fair", labelKey: "profile.onboarding.financing.credit.fair" },
  { value: "working_on_it", labelKey: "profile.onboarding.financing.credit.working_on_it" },
  { value: "unknown", labelKey: "profile.onboarding.financing.credit.unknown" },
] as const;

export const RENT_OR_OWN_OPTIONS = [
  { value: "rent", labelKey: "profile.onboarding.financing.rent_or_own.rent" },
  { value: "own", labelKey: "profile.onboarding.financing.rent_or_own.own" },
] as const;

export const NEED_TO_SELL_OPTIONS = [
  { value: "yes", labelKey: "profile.onboarding.financing.need_to_sell.yes" },
  { value: "no", labelKey: "profile.onboarding.financing.need_to_sell.no" },
  { value: "not_sure", labelKey: "profile.onboarding.financing.need_to_sell.not_sure" },
] as const;

export const MOVE_TIMELINE_OPTIONS = [
  { value: "asap", labelKey: "profile.onboarding.financing.move_timeline.asap" },
  { value: "1_3_months", labelKey: "profile.onboarding.financing.move_timeline.1_3_months" },
  { value: "3_6_months", labelKey: "profile.onboarding.financing.move_timeline.3_6_months" },
  {
    value: "just_browsing",
    labelKey: "profile.onboarding.financing.move_timeline.just_browsing",
  },
] as const;

export const WANT_LENDER_CONNECTION_OPTIONS = [
  { value: "yes", labelKey: "profile.onboarding.financing.want_lender_connection.yes" },
  { value: "no", labelKey: "profile.onboarding.financing.want_lender_connection.no" },
] as const;
