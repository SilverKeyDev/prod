import React from "react";

import { PROFILE_FIELDS_ROW_PROPS } from "packages/features/profile/components/layout";

import AlignedRow from "@/components/layout/AlignedRow";

type LotSizeHomeAgeSliderRowProps = {
  children: React.ReactNode;
};

/** Web — container-aware even columns via AlignedRow. */
export function LotSizeHomeAgeSliderRow({
  children,
}: LotSizeHomeAgeSliderRowProps): React.ReactElement {
  const childArray = React.Children.toArray(children);
  return (
    <AlignedRow {...PROFILE_FIELDS_ROW_PROPS} items={childArray.map((content) => ({ content }))} />
  );
}
