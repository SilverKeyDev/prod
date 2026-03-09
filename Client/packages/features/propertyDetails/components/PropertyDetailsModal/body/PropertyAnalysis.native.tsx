import React from "react";

import { useLocalization } from "packages/contexts";
import { color } from "packages/design-tokens";
import type { PropertyComponentProps } from "packages/features/propertyDetails/components/PropertyDetailsModal/types";
import { Icon } from "packages/ui/components/primitives";
import { Box, Text } from "packages/ui/components/primitives";
import type { IconName } from "packages/ui/types/icons";

import { getSectionIconName } from "@/features/compare/components/CompareHomesModal/sectionIcons";
import { DEFAULT_REPORT_SECTIONS } from "@/features/profile/utils";

type PropertyAnalysisProps = PropertyComponentProps & {
  excludeSections?: string[];
  userPriorities?: string[];
};

function renderSectionContentNative(sectionData: unknown, noDataLabel: string): React.ReactNode {
  if (!sectionData || typeof sectionData !== "object") return null;
  const data = sectionData as Record<string, unknown>;

  if (Array.isArray(data)) {
    return (
      <Box className="gap-2">
        {data.map((item, i) => (
          <Text key={i} className="text-brown/80 text-sm">
            {String(item)}
          </Text>
        ))}
      </Box>
    );
  }

  const entries = Object.entries(data).filter(
    ([, value]) => value !== null && value !== undefined && value !== ""
  );
  if (entries.length === 0) {
    return <Text className="text-brown/60 text-sm">{noDataLabel}</Text>;
  }

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

function buildNativeSections(
  propertyAnalysis: Record<string, unknown>,
  excludeSections: string[],
  userPriorities: string[]
): { key: string; label: string; data: unknown; iconName: string }[] {
  const coreSectionKeys = new Set(["neighborhood_overview"]);
  const excludedSectionKeys = new Set(["pros", "cons", ...excludeSections]);
  const sectionLabels: Record<string, string> = {};
  DEFAULT_REPORT_SECTIONS.forEach((section: { key: string; label: string }) => {
    sectionLabels[section.key] = section.label;
  });
  const defaultPriorityMap = new Map<string, number>();
  DEFAULT_REPORT_SECTIONS.forEach((section, index) => {
    defaultPriorityMap.set(section.key, index);
  });

  const allSectionKeys = Object.keys(propertyAnalysis).filter(
    (key) => propertyAnalysis[key] !== null && propertyAnalysis[key] !== undefined
  );

  return allSectionKeys
    .filter((key) => !coreSectionKeys.has(key) && !excludedSectionKeys.has(key))
    .map((key) => {
      const userPriorityIndex = userPriorities.indexOf(key);
      const priority =
        userPriorityIndex >= 0 ? userPriorityIndex : 1000 + (defaultPriorityMap.get(key) ?? 9999);
      return {
        key,
        label:
          sectionLabels[key] || key.replace(/_/g, " ").replace(/\b\w/g, (l) => l.toUpperCase()),
        data: propertyAnalysis[key],
        iconName: getSectionIconName(key) ?? "check-circle",
        priority,
      };
    })
    .sort((a, b) => a.priority - b.priority);
}

export const PropertyAnalysis: React.FC<PropertyAnalysisProps> = ({
  property,
  excludeSections = [],
  userPriorities = [],
}) => {
  const { t } = useLocalization();
  const propertyWithAnalysis = property as {
    property_analysis?: Record<string, unknown>;
  };
  const propertyAnalysis = propertyWithAnalysis.property_analysis;

  if (!propertyAnalysis) return null;

  const dynamicSections = buildNativeSections(propertyAnalysis, excludeSections, userPriorities);
  const noDataLabel = t("property_analysis.no_data", {
    defaultValue: "No data available",
  });

  if (dynamicSections.length === 0) return null;

  return (
    <Box className="p-6">
      <Box className="gap-6">
        {dynamicSections.map((section) => (
          <Box key={section.key}>
            <Box className="mb-4 flex-row items-center gap-2">
              <Icon name={section.iconName as IconName} size={20} color={color("brown.DEFAULT")} />
              <Text className="text-brown text-lg font-semibold">{section.label}</Text>
            </Box>
            <Box className="border-beige/30 mt-2 rounded-lg border bg-white p-4">
              {renderSectionContentNative(section.data, noDataLabel)}
            </Box>
          </Box>
        ))}
      </Box>
    </Box>
  );
};
