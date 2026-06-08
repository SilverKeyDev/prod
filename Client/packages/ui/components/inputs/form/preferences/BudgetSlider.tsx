import React from "react";

import BudgetRangeSlider, { type BudgetRangeSliderProps } from "./BudgetRangeSlider";

type BudgetSliderProps = Omit<BudgetRangeSliderProps, "variant">;

/** Budget range slider with the green "budget" variant. */
export default function BudgetSlider(props: BudgetSliderProps) {
  return <BudgetRangeSlider {...props} variant="budget" />;
}
