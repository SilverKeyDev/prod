import React from "react";

import { Icon } from "@ui/icons";

import { SectionTintWrapper } from "packages/features/propertyDetails/components/PropertyDetailsModal/sections/layout/SectionTintWrapper";
import type { PropertyComponentProps } from "packages/features/propertyDetails/components/PropertyDetailsModal/types";
import Card from "packages/ui/components/cards/Card";
import { Box } from "packages/ui/components/primitives";
import BodyText from "packages/ui/components/text/BodyText";
import Title from "packages/ui/components/text/Title";

import { DEFAULT_REPORT_SECTIONS } from "@/features/profile/utils";
type PropertySchoolsProps = PropertyComponentProps & {
  analysisContent?: unknown;
};
export const PropertySchools: React.FC<PropertySchoolsProps> = ({ property, analysisContent }) => {
  const { schools } = property as unknown as {
    schools: unknown;
  };
  const hasSchools = schools && Array.isArray(schools) && schools.length > 0;
  if (!hasSchools && !analysisContent) {
    return null;
  }
  const schoolList = hasSchools ? (schools as Array<Record<string, unknown>>) : [];
  const sectionLabel =
    DEFAULT_REPORT_SECTIONS.find((s: { key: string; label: string }) => s.key === "family_friendly")
      ?.label || "Nearby Schools";
  const renderAnalysisContent = (data: unknown): React.ReactNode | null => {
    if (!data || typeof data !== "object") return null;
    const dataObj = data as Record<string, unknown>;
    const entries = Object.entries(dataObj).filter(
      ([_, value]) => value !== null && value !== undefined && value !== ""
    );
    if (entries.length === 0) {
      return null;
    }
    return (
      <Box className="mt-4 flex flex-col gap-4">
        {entries.map(([key, value]) => {
          const displayKey = key.replace(/_/g, " ").replace(/\b\w/g, (l) => l.toUpperCase());
          if (Array.isArray(value)) {
            return (
              <Box key={key}>
                <Title as="h4" size="sm" className="text-foreground mb-2 font-medium">
                  {displayKey}
                </Title>
                <ul className="text-text-secondary ml-4 flex flex-col gap-1 text-sm">
                  {value.map((item, i) => (
                    <li key={i} className="list-disc">
                      {String(item)}
                    </li>
                  ))}
                </ul>
              </Box>
            );
          }
          return (
            <Box key={key} className="flex flex-row flex-col gap-1">
              <BodyText as="span" className="text-foreground text-sm font-medium">
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
  };
  return (
    <Box className="p-6">
      <Box className="mb-4 flex flex-row items-center gap-2">
        <Icon name="graduation-cap" className="text-foreground h-5 w-5" />
        <Title as="h3" size="lg" className="text-foreground font-semibold">
          {sectionLabel}
        </Title>
      </Box>

      <Card border="light" className="mt-2 p-4">
        {hasSchools ? (
          <Box className="flex flex-col gap-3">
            {schoolList.slice(0, 6).map((school, idx) => (
              <Box key={idx} className="flex flex-row items-center justify-between">
                <Box className="flex-1">
                  <Box className="text-foreground font-medium">{String(school.name ?? "")}</Box>
                  <Box className="text-text-secondary text-sm">
                    {String(school.level ?? "")} • {String(school.grades ?? "")}
                  </Box>
                </Box>
                <Box className="text-right">
                  <Box className="text-foreground text-sm font-medium">
                    {String(school.rating ?? 0)}/10
                  </Box>
                  <Box className="text-text-secondary text-xs">
                    {String(school.distance ?? 0)} mi
                  </Box>
                </Box>
              </Box>
            ))}
          </Box>
        ) : null}
        {analysisContent !== undefined && analysisContent !== null && (
          <SectionTintWrapper className="mt-4">
            {renderAnalysisContent(analysisContent)}
          </SectionTintWrapper>
        )}
      </Card>
    </Box>
  );
};
