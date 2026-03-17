/**
 * Commute analysis content block. Separate file so propertyCommuteHelpers
 * only exports components (react-refresh/only-export-components).
 */
import React from "react";

import { Box } from "packages/ui/components/primitives";
import BodyText from "packages/ui/components/text/BodyText";
import Title from "packages/ui/components/text/Title";
export function CommuteAnalysisContent({ data }: { data: unknown }): React.ReactNode {
  if (!data || typeof data !== "object") return null;
  const dataObj = data as Record<string, unknown>;
  const entries = Object.entries(dataObj).filter(
    ([_, value]) => value !== null && value !== undefined && value !== ""
  );
  if (entries.length === 0) return null;
  return (
    <Box className="mt-4 space-y-2 text-left">
      {entries.map(([key, value]) => {
        const displayKey = key.replace(/_/g, " ").replace(/\b\w/g, (l) => l.toUpperCase());
        if (Array.isArray(value)) {
          return (
            <Box key={key}>
              <Title as="h4" size="sm" className="text-text-secondary mb-1 font-medium">
                {displayKey}
              </Title>
              <ul className="text-text-secondary space-y-1 text-sm">
                {value.map((item, i) => (
                  <li key={i}>• {String(item)}</li>
                ))}
              </ul>
            </Box>
          );
        }
        return (
          <Box key={key} className="flex justify-between text-sm">
            <BodyText as="span" className="text-text-secondary">
              {displayKey}:
            </BodyText>
            <BodyText as="span" className="text-text-secondary font-medium">
              {String(value)}
            </BodyText>
          </Box>
        );
      })}
    </Box>
  );
}
