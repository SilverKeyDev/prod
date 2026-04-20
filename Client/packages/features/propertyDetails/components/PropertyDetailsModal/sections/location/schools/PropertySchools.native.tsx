import React from "react";

import { renderKeyValueRecord } from "packages/features/propertyDetails/components/PropertyDetailsModal/helpers/renderKeyValueRecord";
import { SectionTintWrapper } from "packages/features/propertyDetails/components/PropertyDetailsModal/sections/layout/SectionTintWrapper.native";
import type { PropertyComponentProps } from "packages/features/propertyDetails/components/PropertyDetailsModal/types";
import { PropertySectionHeader } from "packages/features/propertyDetails/components/visualizations";
import { Box } from "packages/ui/components/primitives";
import { DEFAULT_REPORT_SECTIONS } from "packages/utils/domain/defaultReportSections";

type PropertySchoolsProps = PropertyComponentProps & {
  analysisContent?: unknown;
};

export const PropertySchools: React.FC<PropertySchoolsProps> = ({ analysisContent }) => {
  if (!analysisContent) return null;

  const sectionLabel =
    DEFAULT_REPORT_SECTIONS.find((s: { key: string; label: string }) => s.key === "family_friendly")
      ?.label ?? "Family-Friendly";

  return (
    <Box className="p-6">
      <PropertySectionHeader iconName="graduation-cap" title={sectionLabel} />

      <Box className="border-border bg-background-surface mt-2 rounded-lg border p-4">
        <SectionTintWrapper>{renderKeyValueRecord(analysisContent)}</SectionTintWrapper>
      </Box>
    </Box>
  );
};
