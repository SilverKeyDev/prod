import React from "react";

import { renderKeyValueRecord } from "packages/features/propertyDetails/components/PropertyDetailsModal/helpers/renderKeyValueRecord";
import { SectionTintWrapper } from "packages/features/propertyDetails/components/PropertyDetailsModal/sections/layout/SectionTintWrapper";
import type { PropertyComponentProps } from "packages/features/propertyDetails/components/PropertyDetailsModal/types";
import { PropertySectionHeader } from "packages/features/propertyDetails/components/visualizations";
import { Box } from "packages/ui/components/structure/primitives";
import Card from "packages/ui/components/surfaces/cards/Card";
import { DEFAULT_REPORT_SECTIONS } from "packages/utils/product/domain/defaultReportSections";

type PropertySchoolsProps = PropertyComponentProps & {
  analysisContent?: unknown;
};

export const PropertySchools: React.FC<PropertySchoolsProps> = ({ analysisContent }) => {
  if (!analysisContent) {
    return null;
  }

  const sectionLabel =
    DEFAULT_REPORT_SECTIONS.find((s: { key: string; label: string }) => s.key === "family_friendly")
      ?.label || "Family-Friendly";

  return (
    <Box className="p-6">
      <PropertySectionHeader iconName="graduation-cap" title={sectionLabel} />

      <Card border="light" className="mt-2 p-4">
        <SectionTintWrapper>{renderKeyValueRecord(analysisContent)}</SectionTintWrapper>
      </Card>
    </Box>
  );
};
