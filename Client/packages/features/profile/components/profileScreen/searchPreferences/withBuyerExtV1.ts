import type { BuyerPreferenceExtensions } from "packages/features/profile/types/buyerPreferenceExtensions";

export function withBuyerExtV1(
  prev: BuyerPreferenceExtensions | undefined,
): BuyerPreferenceExtensions {
  return prev?.v === 1 ? prev : { v: 1 };
}
