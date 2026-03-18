import React from "react";

import BudgetRangeSlider from "./BudgetRangeSlider";

type BudgetSliderProps = Omit<
  React.ComponentProps<typeof BudgetRangeSlider>,
  "variant"
>;

/**
 * Budget range slider with the green "budget" variant (same as transaction "Set a budget" step).
 * Use for home/price budget ranges only; use BudgetRangeSlider for other range inputs (sqft, beds, etc.).
 */
export default function BudgetSlider(props: BudgetSliderProps) {
  return <BudgetRangeSlider {...props} variant="budget" />;
}
