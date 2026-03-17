import React from "react";

import Card from "packages/ui/components/cards/Card";
import { Box } from "packages/ui/components/primitives";
import BodyText from "packages/ui/components/text/BodyText";

type ChooseAreasSectionProps = {
  onComplete?: () => void;
};

/**
 * Native placeholder - area selection with map and isochrones is available on web.
 */
export default function ChooseAreasSection({ onComplete }: ChooseAreasSectionProps) {
  return (
    <Card border="dotted" padding="md" className="mb-2">
      <Box className="gap-2">
        <BodyText size="sm" className="text-text-secondary">
          Configure your search areas on the web app to add important locations and set commute
          ranges. The map with isochrones will show your search area.
        </BodyText>
        {onComplete && (
          <BodyText size="xs" className="text-text-secondary">
            Mark as complete if you&apos;ve already configured areas on web.
          </BodyText>
        )}
      </Box>
    </Card>
  );
}
