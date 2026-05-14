import React from "react";

import { Box } from "packages/ui/components/primitives";

import type { NotInterestedCardProperty } from "./notInterestedCardProperty.types";
import WhyNotInterestedCard from "./WhyNotInterestedCard.web";

type PropertyCardReasonViewProps = {
  property: NotInterestedCardProperty;
  cardType: "searchpage" | "regular";
  onSelectReason: (why: string) => Promise<void>;
  onUndo: () => Promise<void>;
};

export function PropertyCardReasonView({
  property,
  cardType,
  onSelectReason,
  onUndo,
}: PropertyCardReasonViewProps) {
  return (
    <Box onClick={(e) => e.stopPropagation()} className="transition-none">
      <WhyNotInterestedCard
        property={property}
        onSelectReason={onSelectReason}
        onUndo={onUndo}
        cardType={cardType}
      />
    </Box>
  );
}
