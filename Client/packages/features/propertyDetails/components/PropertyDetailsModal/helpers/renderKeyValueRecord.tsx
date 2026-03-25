import React from "react";

import { AnalysisKeyValueLine } from "packages/features/propertyDetails/components/PropertyDetailsModal/helpers/analysisKeyValueLine";
import { Box } from "packages/ui/components/primitives";
import BodyText from "packages/ui/components/text/BodyText";
import Title from "packages/ui/components/text/Title";
import { formatAnalysisLabel } from "packages/utils/propertyDetails";

/**
 * Renders a shallow record as labeled blocks (lists for array values).
 * Used by schools analysis and property analysis fallback.
 */
export function renderKeyValueRecord(data: unknown): React.ReactNode | null {
  if (!data || typeof data !== "object" || Array.isArray(data)) return null;
  const dataObj = data as Record<string, unknown>;
  const entries = Object.entries(dataObj).filter(
    ([, value]) => value !== null && value !== undefined && value !== ""
  );
  if (entries.length === 0) return null;

  return (
    <Box className="flex flex-col gap-4">
      {entries.map(([key, value]) => {
        const displayKey = formatAnalysisLabel(key);
        if (Array.isArray(value)) {
          return (
            <Box key={key}>
              <Title as="h4" size="sm" className="text-foreground mb-2 font-medium">
                {displayKey}
              </Title>
              <Box className="text-text-secondary ml-4 flex flex-col gap-1 text-sm">
                {value.map((item, i) => (
                  <BodyText key={i} as="span" className="text-text-secondary text-sm">
                    • {String(item)}
                  </BodyText>
                ))}
              </Box>
            </Box>
          );
        }
        if (typeof value === "object" && value !== null) {
          return (
            <Box key={key} className="border-border bg-accent-muted rounded-lg border p-3">
              <Title as="h4" size="sm" className="text-text-secondary mb-2 font-medium">
                {displayKey}
              </Title>
              <Box className="space-y-2">
                {Object.entries(value as Record<string, unknown>).map(([subKey, subValue]) => (
                  <AnalysisKeyValueLine
                    key={subKey}
                    label={formatAnalysisLabel(subKey)}
                    value={String(subValue)}
                  />
                ))}
              </Box>
            </Box>
          );
        }
        return <AnalysisKeyValueLine key={key} label={displayKey} value={String(value)} />;
      })}
    </Box>
  );
}
