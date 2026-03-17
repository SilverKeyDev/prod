import React from "react";

import Card from "packages/ui/components/cards/Card";
import { Box } from "packages/ui/components/primitives";
import BodyText from "packages/ui/components/text/BodyText";

type SetBudgetSectionProps = {
  onComplete?: () => void;
};

/**
 * Native placeholder - budget configuration with sliders and affordability estimate is available on web.
 */
export default function SetBudgetSection({ onComplete }: SetBudgetSectionProps) {
  return (
    <Card border="dotted" padding="md" className="mb-2">
      <Box className="gap-2">
        <BodyText size="sm" className="text-text-secondary">
          Set your budget range, income, and down payment on the web app. Search results will filter
          by your budget preferences.
        </BodyText>
        {onComplete && (
          <BodyText size="xs" className="text-text-secondary">
            Mark as complete if you&apos;ve already set your budget on web.
          </BodyText>
        )}
      </Box>
    </Card>
  );
}
