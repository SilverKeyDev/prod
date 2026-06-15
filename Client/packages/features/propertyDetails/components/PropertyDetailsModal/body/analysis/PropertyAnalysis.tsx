import React from "react";

import { useLocalization } from "packages/contexts";
import { PropertySectionRatingBadge } from "packages/features/propertyDetails/components/PropertyDetailsModal/sections/layout/PropertySectionRatingBadge";
import type { PropertyComponentProps } from "packages/features/propertyDetails/components/PropertyDetailsModal/types";
import { PropertySectionHeader } from "packages/features/propertyDetails/components/visualizations";
import { Box } from "packages/ui/components/structure/primitives";
import type { IconName } from "packages/ui/types/icons";
import { DEFAULT_REPORT_SECTIONS } from "packages/utils/product/domain/defaultReportSections";
import {
  buildPropertyAnalysisSections,
  type PropertyAnalysisSection,
  stripSectionRatingField,
  unwrapPropertyAnalysisSection,
} from "packages/utils/transaction/propertyDetails";
import { getSectionIconName } from "packages/utils/transaction/propertyDetails/analysis/sectionIconNames";

import { renderPropertyAnalysisSectionBody } from "./propertyAnalysisSectionRenderers";

type PropertyAnalysisProps = PropertyComponentProps & {
  excludeSections?: string[];
  userPriorities?: string[];
};

function getBuildSectionsOptions(): {
  sectionLabels: Record<string, string>;
  defaultPriorityMap: Map<string, number>;
  getIconName: (key: string) => string;
} {
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

  const options = getBuildSectionsOptions();
  const dynamicSections: PropertyAnalysisSection[] = buildPropertyAnalysisSections(
    propertyAnalysis,
    excludeSections,
    userPriorities,
    options
  );
  const noDataLabel = t("property_analysis.no_data", {
    defaultValue: "No data available",
  });

  if (dynamicSections.length === 0) return null;

  return (
    <Box className="p-6">
      <Box className="flex flex-col gap-10">
        {dynamicSections.map((section) => {
          const { rest: sectionBody, rating: sectionRating } = stripSectionRatingField(
            unwrapPropertyAnalysisSection(section.key, section.data)
          );
          return (
            <Box key={section.key}>
              <PropertySectionHeader
                iconName={section.iconName as IconName}
                title={section.label}
                className="!mb-4"
                action={<PropertySectionRatingBadge rating={sectionRating} />}
              />
              <Box className="border-border bg-background-surface mt-2 rounded-lg border p-4">
                {renderPropertyAnalysisSectionBody(section.key, sectionBody, noDataLabel)}
              </Box>
            </Box>
          );
        })}
      </Box>
    </Box>
  );
};
