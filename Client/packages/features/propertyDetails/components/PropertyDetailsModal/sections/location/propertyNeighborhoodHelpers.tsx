/**
 * Helpers for PropertyNeighborhood; extracted to satisfy max-lines-per-function.
 */
import React from "react";

import { AnalysisKeyValueLine } from "packages/features/propertyDetails/components/PropertyDetailsModal/helpers/analysisKeyValueLine";
import { LabeledBarRow } from "packages/features/propertyDetails/components/visualizations";
import { Box } from "packages/ui/components/primitives";
import Title from "packages/ui/components/text/Title";
import { formatAnalysisLabel } from "packages/utils/propertyDetails";

export function renderNeighborhoodContent(data: Record<string, unknown>): React.ReactNode {
  const entries = Object.entries(data).filter(
    ([_, value]) => value !== null && value !== undefined && value !== ""
  );
  if (entries.length === 0) return null;
  return (
    <Box className="space-y-6">
      {entries.map(([key, value]) => {
        const displayKey = formatAnalysisLabel(key);
        if (Array.isArray(value)) {
          return (
            <Box key={key}>
              <Title as="h4" size="sm" className="text-text-secondary mb-2 font-medium">
                {displayKey}
              </Title>
              <ul className="text-text-secondary ml-4 space-y-1 text-sm">
                {value.map((item, i) => (
                  <li key={i} className="list-disc">
                    {String(item)}
                  </li>
                ))}
              </ul>
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

export function renderAgeDistribution(data: Record<string, string>): React.ReactNode {
  const entries = Object.entries(data)
    .map(([key, value]) => {
      const numValue = parseFloat(String(value).replace("%", "")) || 0;
      return { key, value, numValue };
    })
    .sort((a, b) => {
      const order = ["0-19", "20-34", "35-49", "50-64", "65+"];
      return order.indexOf(a.key) - order.indexOf(b.key);
    });
  const maxValue = Math.max(...entries.map((e) => e.numValue), 100);
  return (
    <Box className="space-y-3">
      <Title as="h4" size="sm" className="text-text-secondary font-medium">
        Age Distribution
      </Title>
      <Box className="space-y-2">
        {entries.map(({ key, value, numValue }) => (
          <LabeledBarRow
            key={key}
            label={`${key} years`}
            valueText={value}
            fillRatio={numValue / maxValue}
          />
        ))}
      </Box>
    </Box>
  );
}
