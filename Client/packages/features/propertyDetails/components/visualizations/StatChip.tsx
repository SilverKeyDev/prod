import React from "react";

import { Icon } from "packages/ui/components/structure/primitives";
import { Box } from "packages/ui/components/structure/primitives";
import BodyText from "packages/ui/components/structure/text/BodyText";
import type { IconName } from "packages/ui/types/icons";

export type StatChipProps = {
  iconName: IconName;
  value: string;
  label: string;
  /** When true, slightly larger emphasis (e.g. $/sqft). */
  emphasized?: boolean;
};

export function StatChip({
  iconName,
  value,
  label,
  emphasized = false,
}: StatChipProps): React.ReactElement {
  return (
    <Box
      className={`border-border-card bg-background-surface flex min-w-[4.5rem] flex-1 flex-col items-center rounded-xl border px-3 py-2.5 sm:min-w-[5.5rem] sm:px-4 sm:py-3 ${
        emphasized ? "ring-brand-accent/20 ring-1" : ""
      }`}
    >
      <Icon
        name={iconName}
        size={emphasized ? 22 : 18}
        className="text-brand-accent mb-1 shrink-0"
        aria-hidden
      />
      <BodyText
        as="span"
        className={`text-text-primary text-center font-semibold ${emphasized ? "text-lg sm:text-xl" : "text-base sm:text-lg"}`}
      >
        {value}
      </BodyText>
      <BodyText as="span" className="text-text-secondary mt-0.5 text-center text-xs">
        {label}
      </BodyText>
    </Box>
  );
}
