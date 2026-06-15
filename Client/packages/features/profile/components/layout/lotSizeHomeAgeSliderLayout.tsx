import React from "react";

import { ResponsiveEqualColumns } from "packages/ui/components/structure/layout";

type LotSizeHomeAgeSliderRowProps = {
  children: React.ReactNode;
};

/** Native / shared fallback — responsive flex columns without DOM-specific AlignedRow. */
export function LotSizeHomeAgeSliderRow({
  children,
}: LotSizeHomeAgeSliderRowProps): React.ReactElement {
  return <ResponsiveEqualColumns>{children}</ResponsiveEqualColumns>;
}
