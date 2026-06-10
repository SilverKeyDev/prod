/** Buyer About Me field slugs and UI options (SIL-182). */

export const BUYER_MOVING_WITH_VALUES = [
  "just_me",
  "partner",
  "kids",
  "other_family",
  "roommates",
] as const;

export type BuyerMovingWithValue = (typeof BUYER_MOVING_WITH_VALUES)[number];

export const BUYER_PET_TYPE_VALUES = ["dog", "cat", "other"] as const;

export type BuyerPetTypeValue = (typeof BUYER_PET_TYPE_VALUES)[number];

export type BuyerAboutMePrefs = {
  moving_with?: BuyerMovingWithValue[];
  kids_ages?: string;
  pet_types?: BuyerPetTypeValue[];
  move_motivation?: string;
};
