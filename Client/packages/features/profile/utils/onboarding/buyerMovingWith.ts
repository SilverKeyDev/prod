import type { BuyerMovingWithValue } from "packages/features/profile/types/buyerAboutMe";

export const BUYER_MOVING_WITH_JUST_ME: BuyerMovingWithValue = "just_me";

/**
 * Toggle a moving-with chip while enforcing mutual exclusivity:
 * - "just_me" cannot coexist with partner, kids, etc.
 * - Other options can be combined (e.g. kids + partner).
 */
export function toggleBuyerMovingWithSelection(
  current: readonly string[],
  toggledValue: string
): BuyerMovingWithValue[] {
  const isSelected = current.includes(toggledValue);

  if (toggledValue === BUYER_MOVING_WITH_JUST_ME) {
    return isSelected ? [] : [BUYER_MOVING_WITH_JUST_ME];
  }

  const withoutJustMe = current.filter((value) => value !== BUYER_MOVING_WITH_JUST_ME);

  if (isSelected) {
    return withoutJustMe.filter((value) => value !== toggledValue) as BuyerMovingWithValue[];
  }

  return [...withoutJustMe, toggledValue] as BuyerMovingWithValue[];
}
