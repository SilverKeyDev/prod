import React from "react";

import { Box } from "packages/ui/components/primitives";

import type { Property, SearchResult } from "@/features/search/types";

import WhyNotInterestedCard from "./WhyNotInterestedCard.web";

type PropertyCardReasonViewProps = {
  property: SearchResult | Property;
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
    <Box
      role="button"
      tabIndex={0}
      onClick={(e) => e.stopPropagation()}
      onKeyDown={(e) => {
        if (e.key === "Enter" || e.key === " ") e.preventDefault();
      }}
      className="transition-none"
    >
      <WhyNotInterestedCard
        property={property}
        onSelectReason={onSelectReason}
        onUndo={onUndo}
        cardType={cardType}
      />
    </Box>
  );
}
