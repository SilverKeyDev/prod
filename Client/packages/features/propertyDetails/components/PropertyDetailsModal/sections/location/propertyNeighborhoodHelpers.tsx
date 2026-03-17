/**
 * Helpers for PropertyNeighborhood; extracted to satisfy max-lines-per-function.
 */
import React from "react";

import { Box } from "packages/ui/components/primitives";

import { BodyText, Title } from "@/components/ui";

export function renderNeighborhoodContent(data: Record<string, unknown>): React.ReactNode {
  const entries = Object.entries(data).filter(
    ([_, value]) => value !== null && value !== undefined && value !== ""
  );
  if (entries.length === 0) return null;
  return (
    <Box className="space-y-4">
      {entries.map(([key, value]) => {
        const displayKey = key.replace(/_/g, " ").replace(/\b\w/g, (l) => l.toUpperCase());
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
              <Box className="text-text-secondary space-y-2 text-sm">
                {Object.entries(value as Record<string, unknown>).map(([subKey, subValue]) => (
                  <Box key={subKey} className="flex flex-col">
                    <BodyText as="span" className="text-text-secondary font-medium">
                      {subKey.replace(/_/g, " ").replace(/\b\w/g, (l) => l.toUpperCase())}
                    </BodyText>
                    <BodyText as="span" className="text-text-secondary">
                      {String(subValue)}
                    </BodyText>
                  </Box>
                ))}
              </Box>
            </Box>
          );
        }
        return (
          <Box key={key} className="flex flex-col space-y-1">
            <BodyText as="span" className="text-text-secondary text-sm font-medium">
              {displayKey}
            </BodyText>
            <BodyText as="span" className="text-text-secondary text-sm">
              {String(value)}
            </BodyText>
          </Box>
        );
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
          <Box key={key} className="space-y-1">
            <Box className="flex justify-between text-sm">
              <BodyText as="span" className="text-text-secondary">
                {key} years
              </BodyText>
              <BodyText as="span" className="text-text-secondary font-medium">
                {value}
              </BodyText>
            </Box>
            <Box className="bg-accent-muted h-2 w-full overflow-hidden rounded-full">
              <Box
                className="bg-primary h-full rounded-full transition-all"
                style={{ width: `${(numValue / maxValue) * 100}%` }}
              />
            </Box>
          </Box>
        ))}
      </Box>
    </Box>
  );
}
