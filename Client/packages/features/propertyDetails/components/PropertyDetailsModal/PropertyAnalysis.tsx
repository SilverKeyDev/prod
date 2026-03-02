import React from "react";

import { useLocalization } from "packages/contexts";
import type { PropertyWithAnalysis } from "packages/types/property-analysis";
import { Title } from "packages/ui/components/index.web";

import Card from "@/components/layout/Card.web";

import {
  buildPropertyAnalysisDynamicSections,
  renderPropertyAnalysisSectionContent,
} from "./helpers/propertyAnalysisHelpers";
import type { PropertyComponentProps } from "./types";

type PropertyAnalysisProps = PropertyComponentProps & {
  excludeSections?: string[];
  userPriorities?: string[];
};

export const PropertyAnalysis: React.FC<PropertyAnalysisProps> = ({
  property,
  excludeSections = [],
  userPriorities = [],
}) => {
  const { t } = useLocalization();
  const propertyWithAnalysis = property as PropertyWithAnalysis;
  const propertyAnalysis = propertyWithAnalysis.property_analysis;

  if (!propertyAnalysis) return null;

  const dynamicSections = buildPropertyAnalysisDynamicSections(
    propertyAnalysis as Record<string, unknown>,
    excludeSections,
    userPriorities
  );
  const noDataLabel = t("property_analysis.no_data");

  return (
    <div className="p-6">
      {dynamicSections.length > 0 && (
        <div className="grid grid-cols-1 gap-6">
          {dynamicSections.map((section) => (
            <div key={section.key}>
              <div className="mb-4 flex items-center gap-2">
                {section.icon}
                <Title as="h3" size="lg" className="text-brown font-semibold">
                  {section.label}
                </Title>
              </div>
              <Card className="mt-2 p-4">
                {renderPropertyAnalysisSectionContent(section.key, section.data, noDataLabel)}
              </Card>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};
