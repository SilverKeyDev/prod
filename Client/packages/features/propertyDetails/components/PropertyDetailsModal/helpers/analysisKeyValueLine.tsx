import React from "react";

import BodyText from "packages/ui/components/text/BodyText";

export type AnalysisKeyValueLineProps = {
  label: string;
  value: string;
};

/**
 * Single line: semibold label, colon, space, then value (secondary tone).
 */
export function AnalysisKeyValueLine({
  label,
  value,
}: AnalysisKeyValueLineProps): React.ReactElement {
  return (
    <BodyText as="p" size="sm" className="text-text-secondary">
      <BodyText as="span" className="text-foreground font-semibold">
        {label}
      </BodyText>
      <BodyText as="span">: </BodyText>
      <BodyText as="span">{value}</BodyText>
    </BodyText>
  );
}
