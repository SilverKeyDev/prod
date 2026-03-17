/**
 * Helpers for PropertyAnalysis; extracted to satisfy max-lines-per-function.
 * Section building logic lives in packages/utils/propertyDetails.
 */
import React from "react";

import { Box } from "packages/ui/components/primitives";
import { buildPropertyAnalysisSections } from "packages/utils/propertyDetails";

import { BodyText, Title } from "@/components/ui";
import {
  getSectionIconName,
  renderSectionIcon,
} from "@/features/compare/components/CompareHomesModal/sectionIcons";
import { DEFAULT_REPORT_SECTIONS } from "@/features/profile/utils";

export function renderPropertyAnalysisSectionContent(
  _sectionKey: string,
  sectionData: unknown,
  noDataLabel: string
): React.ReactNode {
  if (!sectionData || typeof sectionData !== "object") return null;
  const data = sectionData as Record<string, unknown>;

  if (Array.isArray(data)) {
    return (
      <ul className="space-y-2">
        {data.map((item, i) => (
          <li key={i} className="text-text-secondary text-sm">
            {String(item)}
          </li>
        ))}
      </ul>
    );
  }

  const entries = Object.entries(data).filter(
    ([_, value]) => value !== null && value !== undefined && value !== ""
  );
  if (entries.length === 0) {
    return (
      <BodyText as="p" size="sm" className="text-text-secondary">
        {noDataLabel}
      </BodyText>
    );
  }

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
              <ul className="ml-4 space-y-1">
                {value.map((item, i) => (
                  <li key={i} className="text-text-secondary list-disc text-sm">
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

type DynamicSectionItem = {
  key: string;
  label: string;
  data: unknown;
  icon: React.ReactNode;
  priority: number;
};

function getBuildSectionsOptions() {
  const sectionLabels: Record<string, string> = {};
  const defaultPriorityMap = new Map<string, number>();
  DEFAULT_REPORT_SECTIONS.forEach((section: { key: string; label: string }) => {
    sectionLabels[section.key] = section.label;
  });
  DEFAULT_REPORT_SECTIONS.forEach((section, index) => {
    defaultPriorityMap.set(section.key, index);
  });
  return {
    sectionLabels,
    defaultPriorityMap,
    getIconName: (key: string) => getSectionIconName(key) ?? "check-circle",
  };
}

export function buildPropertyAnalysisDynamicSections(
  propertyAnalysis: Record<string, unknown>,
  excludeSections: string[],
  userPriorities: string[]
): DynamicSectionItem[] {
  const options = getBuildSectionsOptions();
  const sections = buildPropertyAnalysisSections(
    propertyAnalysis,
    excludeSections,
    userPriorities,
    options
  );
  return sections.map((s) => ({
    key: s.key,
    label: s.label,
    data: s.data,
    icon: renderSectionIcon(s.key, "h-5 w-5 text-text-secondary"),
    priority: s.priority,
  }));
}
