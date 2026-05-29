import type { BuyerPreferenceExtensions } from "packages/features/profile/types/sections/buyerPreferenceExtensions";

export type PatchBuyerPreferenceExtensions = (
  fn: (prev: BuyerPreferenceExtensions | undefined) => BuyerPreferenceExtensions
) => void;
