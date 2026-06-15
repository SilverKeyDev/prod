import React from "react";

import { Box } from "packages/ui/components/structure/primitives";
import Card from "packages/ui/components/surfaces/cards/Card";

import { BodyText } from "@/components/ui";

type ReviewComparablesSectionProps = {
  onComplete?: () => void;
};

export default function ReviewComparablesSection({
  onComplete: _onComplete,
}: ReviewComparablesSectionProps) {
  return (
    <Card border="dotted" padding="md" className="mb-2">
      <Box className="gap-3">
        <BodyText size="sm" className="text-text-primary font-medium">
          Review comparable sales and get a data-backed offer strategy for the property you
          selected.
        </BodyText>
        <BodyText size="xs" className="text-text-secondary">
          Use this to ensure you don&apos;t overpay and to formulate a competitive starting price.
        </BodyText>
      </Box>
    </Card>
  );
}
