import React from "react";

import { useLocalization } from "packages/contexts";
import { renderKeyValueRecord } from "packages/features/propertyDetails/components/PropertyDetailsModal/helpers/renderKeyValueRecord";
import { SectionTintWrapper } from "packages/features/propertyDetails/components/PropertyDetailsModal/sections/layout/SectionTintWrapper.native";
import type { PropertyComponentProps } from "packages/features/propertyDetails/components/PropertyDetailsModal/types";
import {
  PropertySectionHeader,
  ScoreBar,
} from "packages/features/propertyDetails/components/visualizations";
import { Box } from "packages/ui/components/primitives";
import BodyText from "packages/ui/components/text/BodyText";
import { DEFAULT_REPORT_SECTIONS } from "packages/utils/domain/defaultReportSections";

type PropertySchoolsProps = PropertyComponentProps & {
  analysisContent?: unknown;
};

export const PropertySchools: React.FC<PropertySchoolsProps> = ({
  property,
  analysisContent,
}) => {
  const { t } = useLocalization();
  const { schools } = property as unknown as { schools: unknown };
  const hasSchools = schools && Array.isArray(schools) && schools.length > 0;
  if (!hasSchools && !analysisContent) return null;

  const schoolList = hasSchools
    ? (schools as Array<Record<string, unknown>>)
    : [];
  const sectionLabel =
    DEFAULT_REPORT_SECTIONS.find(
      (s: { key: string; label: string }) => s.key === "family_friendly",
    )?.label ?? "Nearby Schools";

  const miSuffix = t("property_details.mi", { defaultValue: "mi" });
  const bullet = t("property_details.bullet_separator", {
    defaultValue: " • ",
  });

  return (
    <Box className="p-6">
      <PropertySectionHeader iconName="graduation-cap" title={sectionLabel} />

      <Box className="border-border bg-background-surface mt-2 rounded-lg border p-4">
        {hasSchools ? (
          <Box className="gap-3">
            {schoolList.slice(0, 6).map((school, idx) => {
              const ratingRaw = school.rating;
              const ratingNum =
                typeof ratingRaw === "number"
                  ? ratingRaw
                  : typeof ratingRaw === "string"
                    ? parseFloat(ratingRaw)
                    : NaN;
              const score = Number.isFinite(ratingNum) ? ratingNum : 0;
              const distRaw = school.distance;
              const distStr =
                distRaw !== undefined && distRaw !== null
                  ? String(distRaw)
                  : "";

              return (
                <Box
                  key={idx}
                  className="border-border-card bg-bg-card-subtle flex-row items-center justify-between gap-3 rounded-xl border p-3"
                >
                  <Box className="min-w-0 flex-1">
                    <BodyText
                      as="span"
                      size="sm"
                      className="text-text-primary font-semibold"
                      numberOfLines={1}
                    >
                      {String(school.name ?? "")}
                    </BodyText>
                    <BodyText
                      as="span"
                      size="xs"
                      className="text-text-secondary mt-1"
                    >
                      {String(school.level ?? "")}
                      {bullet}
                      {String(school.grades ?? "")}
                    </BodyText>
                  </Box>
                  <Box className="shrink-0 items-end gap-2">
                    <ScoreBar
                      score={score}
                      max={10}
                      label={t("property_details.section_rating_value", {
                        value: Math.round(score * 10) / 10,
                        defaultValue: "{{value}}/10",
                      })}
                    />
                    {distStr !== "" ? (
                      <Box className="border-border rounded-full border px-2.5 py-0.5">
                        <BodyText
                          as="span"
                          size="xs"
                          className="text-text-secondary font-medium"
                        >
                          {distStr} {miSuffix}
                        </BodyText>
                      </Box>
                    ) : null}
                  </Box>
                </Box>
              );
            })}
          </Box>
        ) : null}
        {analysisContent !== undefined && analysisContent !== null ? (
          <SectionTintWrapper className="mt-4">
            {renderKeyValueRecord(analysisContent)}
          </SectionTintWrapper>
        ) : null}
      </Box>
    </Box>
  );
};
