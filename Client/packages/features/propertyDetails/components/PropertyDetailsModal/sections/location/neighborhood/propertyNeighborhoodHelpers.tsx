/**
 * Helpers for PropertyNeighborhood; extracted to satisfy max-lines-per-function.
 */
import React from "react";

import { color } from "packages/design-tokens";
import { AnalysisKeyValueLine } from "packages/features/propertyDetails/components/PropertyDetailsModal/helpers/analysisKeyValueLine";
import {
  DonutChart,
  LabeledBarRow,
  LollipopChart,
  VerticalBarChart,
} from "packages/features/propertyDetails/components/visualizations";
import { Box, Icon } from "packages/ui/components/primitives";
import Title from "packages/ui/components/text/Title";
import type { IconName } from "packages/ui/types/icons";
import { formatAnalysisLabel } from "packages/utils/propertyDetails";

function demographicsChartHeading(iconName: IconName, title: string): React.ReactElement {
  return (
    <Box className="flex flex-row items-center gap-2">
      <Icon name={iconName} size={16} className="text-foreground shrink-0" aria-hidden />
      <Title as="h4" size="sm" className="text-foreground font-medium">
        {title}
      </Title>
    </Box>
  );
}

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
      {demographicsChartHeading("calendar", "Age Distribution")}
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

export function renderRaceDistribution(data: Record<string, string>): React.ReactNode {
  const labelMap: Record<string, string> = {
    white: "White",
    black: "Black/African American",
    asian: "Asian",
    hispanic: "Hispanic/Latino",
  };

  const colorMap: Record<string, string> = {
    white: color("primary"),
    black: color("accent"),
    asian: color("destructive"),
    hispanic: color("neutral.400"),
  };

  const chartData = Object.entries(data).map(([key, value]) => {
    const numValue = parseFloat(String(value).replace("%", "")) || 0;
    return {
      label: labelMap[key] || key,
      value: numValue,
      color: colorMap[key] || color("neutral.500"),
    };
  });

  return (
    <Box className="space-y-3">
      {demographicsChartHeading("users", "Race/Ethnicity Distribution")}
      <DonutChart data={chartData} />
    </Box>
  );
}

export function renderIncomeDistribution(data: Record<string, string>): React.ReactNode {
  const labelMap: Record<string, string> = {
    under_25k: "<$25k",
    "25k_50k": "$25k-50k",
    "50k_75k": "$50k-75k",
    "75k_100k": "$75k-100k",
    "100k_150k": "$100k-150k",
    over_150k: ">$150k",
  };

  const order = ["under_25k", "25k_50k", "50k_75k", "75k_100k", "100k_150k", "over_150k"];

  const chartData = order
    .filter((key) => key in data)
    .map((key) => {
      const value = data[key];
      const numValue = parseFloat(String(value).replace("%", "")) || 0;
      return {
        label: labelMap[key] || key,
        value: numValue,
        displayValue: value,
      };
    });

  return (
    <Box className="space-y-3">
      {demographicsChartHeading("dollar-sign", "Household Income Distribution")}
      <VerticalBarChart data={chartData} />
    </Box>
  );
}

export function renderEducationDistribution(data: Record<string, string>): React.ReactNode {
  const labelMap: Record<string, string> = {
    high_school: "High School or Higher",
    bachelors: "Bachelor's Degree",
    graduate: "Graduate Degree",
  };

  const order = ["high_school", "bachelors", "graduate"];

  const chartData = order
    .filter((key) => key in data)
    .map((key) => {
      const value = data[key];
      const numValue = parseFloat(String(value).replace("%", "")) || 0;
      return {
        label: labelMap[key] || key,
        value: numValue,
        displayValue: value,
      };
    });

  return (
    <Box className="space-y-3">
      {demographicsChartHeading("graduation-cap", "Educational Attainment")}
      <LollipopChart data={chartData} />
    </Box>
  );
}
