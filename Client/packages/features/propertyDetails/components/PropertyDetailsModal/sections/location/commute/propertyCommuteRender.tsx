/**
 * Commute analysis content block. Separate file so propertyCommuteHelpers
 * only exports components (react-refresh/only-export-components).
 */
import React from "react";

import { AnalysisKeyValueLine } from "packages/features/propertyDetails/components/PropertyDetailsModal/helpers/analysisKeyValueLine";
import { Box } from "packages/ui/components/structure/primitives";
import BodyText from "packages/ui/components/structure/text/BodyText";
import Title from "packages/ui/components/structure/text/Title";
import { formatAnalysisLabel } from "packages/utils/transaction/propertyDetails";

export function CommuteAnalysisContent({ data }: { data: unknown }): React.ReactNode {
  if (!data || typeof data !== "object") return null;
  const dataObj = data as Record<string, unknown>;
  const entries = Object.entries(dataObj).filter(
    ([_, value]) => value !== null && value !== undefined && value !== ""
  );
  if (entries.length === 0) return null;
  return (
    <Box className="space-y-2 text-left">
      {entries.map(([key, value]) => {
        const displayKey = formatAnalysisLabel(key);
        if (Array.isArray(value)) {
          return (
            <Box key={key}>
              <Title as="h4" size="sm" className="text-text-secondary mb-1 font-medium">
                {displayKey}
              </Title>
              <Box className="text-text-secondary ml-1 flex flex-col gap-1 text-sm">
                {value.map((item, i) => (
                  <BodyText key={i} as="span" className="text-text-secondary text-sm">
                    • {String(item)}
                  </BodyText>
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
