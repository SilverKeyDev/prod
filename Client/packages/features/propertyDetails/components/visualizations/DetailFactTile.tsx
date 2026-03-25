import React from "react";

import { Icon } from "packages/ui/components/primitives";
import { Box } from "packages/ui/components/primitives";
import BodyText from "packages/ui/components/text/BodyText";
import type { IconName } from "packages/ui/types/icons";

export type DetailFactTileProps = {
  iconName: IconName;
  label: string;
  value: string;
  /** Larger value typography for key metrics (year, $/sqft). */
  emphasized?: boolean;
};

export function DetailFactTile({
  iconName,
  label,
  value,
  emphasized = false,
}: DetailFactTileProps): React.ReactElement {
  return (
    <Box className="border-border-card bg-bg-card-subtle flex flex-col rounded-xl border p-3 sm:p-4">
      <Box className="mb-2 flex flex-row items-center gap-2">
        <Icon name={iconName} size={18} className="text-brand-accent shrink-0" aria-hidden />
        <BodyText as="span" size="xs" className="text-text-secondary font-medium">
          {label}
        </BodyText>
      </Box>
      <BodyText
        as="p"
        size={emphasized ? "md" : "sm"}
        className={`text-text-primary font-semibold ${emphasized ? "text-base sm:text-lg" : ""}`}
      >
        {value}
      </BodyText>
    </Box>
  );
}
