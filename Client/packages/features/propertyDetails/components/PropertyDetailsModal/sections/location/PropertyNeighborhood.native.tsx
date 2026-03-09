import React from "react";

import { color } from "packages/design-tokens";
import { SectionTintWrapper } from "packages/features/propertyDetails/components/PropertyDetailsModal/sections/layout/SectionTintWrapper.native";
import type { PropertyComponentProps } from "packages/features/propertyDetails/components/PropertyDetailsModal/types";
import { Icon } from "packages/ui/components/primitives";
import { Box, Text } from "packages/ui/components/primitives";

import { DEFAULT_REPORT_SECTIONS } from "@/features/profile/utils";

function renderNeighborhoodContent(data: Record<string, unknown>): React.ReactNode {
  const entries = Object.entries(data).filter(
    ([, value]) => value !== null && value !== undefined && value !== ""
  );
  if (entries.length === 0) return null;
  return (
    <Box className="gap-4">
      {entries.map(([key, value]) => {
        const displayKey = key.replace(/_/g, " ").replace(/\b\w/g, (l) => l.toUpperCase());
        if (Array.isArray(value)) {
          return (
            <Box key={key}>
              <Text className="text-brown mb-2 text-sm font-medium">{displayKey}</Text>
              <Box className="ml-4 gap-1">
                {value.map((item, i) => (
                  <Text key={i} className="text-brown/80 text-sm">
                    • {String(item)}
                  </Text>
                ))}
              </Box>
            </Box>
          );
        }
        if (typeof value === "object" && value !== null) {
          return (
            <Box key={key} className="border-beige/40 bg-beige/10 rounded-lg border p-3">
              <Text className="text-brown mb-2 text-sm font-medium">{displayKey}</Text>
              <Box className="gap-2">
                {Object.entries(value as Record<string, unknown>).map(([subKey, subValue]) => (
                  <Box key={subKey}>
                    <Text className="text-brown text-sm font-medium">
                      {subKey.replace(/_/g, " ").replace(/\b\w/g, (l) => l.toUpperCase())}
                    </Text>
                    <Text className="text-brown/80 text-sm">{String(subValue)}</Text>
                  </Box>
                ))}
              </Box>
            </Box>
          );
        }
        return (
          <Box key={key} className="gap-1">
            <Text className="text-brown text-sm font-medium">{displayKey}</Text>
            <Text className="text-brown/80 text-sm">{String(value)}</Text>
          </Box>
        );
      })}
    </Box>
  );
}

function renderAgeDistribution(data: Record<string, string>): React.ReactNode {
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
    <Box className="gap-3">
      <Text className="text-brown text-sm font-medium">Age Distribution</Text>
      <Box className="gap-2">
        {entries.map(({ key, value, numValue }) => (
          <Box key={key} className="gap-1">
            <Box className="flex-row justify-between">
              <Text className="text-brown/70 text-sm">{key} years</Text>
              <Text className="text-brown text-sm font-medium">{value}</Text>
            </Box>
            <Box className="bg-beige/30 h-2 w-full overflow-hidden rounded-full">
              <Box
                className="bg-olive h-full rounded-full"
                style={{ width: `${(numValue / maxValue) * 100}%` }}
              />
            </Box>
          </Box>
        ))}
      </Box>
    </Box>
  );
}

type PropertyNeighborhoodProps = PropertyComponentProps & {
  analysisContent?: unknown;
};

export const PropertyNeighborhood: React.FC<PropertyNeighborhoodProps> = ({
  property: _property,
  analysisContent,
}) => {
  const neighborhoodOverview = analysisContent as Record<string, unknown> | undefined;
  const ageDistribution = neighborhoodOverview?.age_distribution as
    | Record<string, string>
    | undefined;
  const neighborhoodContent = neighborhoodOverview ? { ...neighborhoodOverview } : undefined;
  if (neighborhoodContent && "age_distribution" in neighborhoodContent) {
    delete neighborhoodContent.age_distribution;
  }
  const hasNeighborhoodContent = neighborhoodContent && Object.keys(neighborhoodContent).length > 0;
  const hasAgeDistribution = ageDistribution && Object.keys(ageDistribution).length > 0;
  if (!hasNeighborhoodContent && !hasAgeDistribution) return null;

  const sectionLabel =
    DEFAULT_REPORT_SECTIONS.find((s: { key: string; label: string }) => s.key === "neighborhood")
      ?.label ?? "Neighborhood Information";

  return (
    <Box className="p-6">
      <Box className="mb-4 flex-row items-center gap-2">
        <Icon name="shield" size={20} color={color("brown.DEFAULT")} />
        <Text className="text-brown text-lg font-semibold">{sectionLabel}</Text>
      </Box>
      <SectionTintWrapper className="mt-2">
        <Box className="gap-6">
          {hasNeighborhoodContent && (
            <Box className="border-beige/30 rounded-lg border bg-white p-4">
              {renderNeighborhoodContent(neighborhoodContent!)}
            </Box>
          )}
          {hasAgeDistribution && (
            <Box className="border-beige/30 rounded-lg border bg-white p-4">
              {renderAgeDistribution(ageDistribution!)}
            </Box>
          )}
        </Box>
      </SectionTintWrapper>
    </Box>
  );
};
