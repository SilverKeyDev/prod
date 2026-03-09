import React from "react";

import { color } from "packages/design-tokens";
import { SectionTintWrapper } from "packages/features/propertyDetails/components/PropertyDetailsModal/sections/layout/SectionTintWrapper.native";
import type { PropertyComponentProps } from "packages/features/propertyDetails/components/PropertyDetailsModal/types";
import { Icon } from "packages/ui/components/primitives";
import { Box, Text } from "packages/ui/components/primitives";

import { DEFAULT_REPORT_SECTIONS } from "@/features/profile/utils";

type PropertySchoolsProps = PropertyComponentProps & {
  analysisContent?: unknown;
};

function renderAnalysisContent(data: unknown): React.ReactNode {
  if (!data || typeof data !== "object") return null;
  const dataObj = data as Record<string, unknown>;
  const entries = Object.entries(dataObj).filter(
    ([, value]) => value !== null && value !== undefined && value !== ""
  );
  if (entries.length === 0) return null;
  return (
    <Box className="mt-4 gap-4">
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

export const PropertySchools: React.FC<PropertySchoolsProps> = ({ property, analysisContent }) => {
  const { schools } = property as unknown as { schools: unknown };
  const hasSchools = schools && Array.isArray(schools) && schools.length > 0;
  if (!hasSchools && !analysisContent) return null;

  const schoolList = hasSchools ? (schools as Array<Record<string, unknown>>) : [];
  const sectionLabel =
    DEFAULT_REPORT_SECTIONS.find((s: { key: string; label: string }) => s.key === "family_friendly")
      ?.label ?? "Nearby Schools";

  return (
    <Box className="p-6">
      <Box className="mb-4 flex-row items-center gap-2">
        <Icon name="graduation-cap" size={20} color={color("brown.DEFAULT")} />
        <Text className="text-brown text-lg font-semibold">{sectionLabel}</Text>
      </Box>

      <Box className="border-beige/30 mt-2 rounded-lg border bg-white p-4">
        {hasSchools ? (
          <Box className="gap-3">
            {schoolList.slice(0, 6).map((school, idx) => (
              <Box key={idx} className="flex-row items-center justify-between">
                <Box className="min-w-0 flex-1">
                  <Text className="text-brown font-medium" numberOfLines={1}>
                    {String(school.name ?? "")}
                  </Text>
                  <Text className="text-sm text-gray-600">
                    {String(school.level ?? "")} • {String(school.grades ?? "")}
                  </Text>
                </Box>
                <Box className="items-end">
                  <Text className="text-brown text-sm font-medium">
                    {String(school.rating ?? 0)}/10
                  </Text>
                  <Text className="text-xs text-gray-500">{String(school.distance ?? 0)} mi</Text>
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
      </Box>
    </Box>
  );
};
