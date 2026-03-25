import React from "react";

import { useLocalization } from "packages/contexts";
import { renderKeyValueRecord } from "packages/features/propertyDetails/components/PropertyDetailsModal/helpers/renderKeyValueRecord";
import { PropertySectionRatingBadge } from "packages/features/propertyDetails/components/PropertyDetailsModal/sections/layout/PropertySectionRatingBadge";
import { SectionTintWrapper } from "packages/features/propertyDetails/components/PropertyDetailsModal/sections/layout/SectionTintWrapper";
import type { PropertyComponentProps } from "packages/features/propertyDetails/components/PropertyDetailsModal/types";
import { PropertySectionHeader } from "packages/features/propertyDetails/components/visualizations";
import Card from "packages/ui/components/cards/Card";
import { Box } from "packages/ui/components/primitives";
import BodyText from "packages/ui/components/text/BodyText";
import { DEFAULT_REPORT_SECTIONS } from "packages/utils/domain/defaultReportSections";

type PropertySchoolsProps = PropertyComponentProps & {
  analysisContent?: unknown;
};

export const PropertySchools: React.FC<PropertySchoolsProps> = ({ property, analysisContent }) => {
  const { t } = useLocalization();
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

  const miSuffix = t("property_details.mi", { defaultValue: "mi" });

  return (
    <Box className="p-6">
      <PropertySectionHeader iconName="graduation-cap" title={sectionLabel} />

      <Card border="light" className="mt-2 p-4">
        {hasSchools ? (
          <Box className="flex flex-col gap-3">
            {schoolList.slice(0, 6).map((school, idx) => {
              const ratingRaw = school.rating;
              const ratingNum =
                typeof ratingRaw === "number"
                  ? ratingRaw
                  : typeof ratingRaw === "string"
                    ? parseFloat(ratingRaw)
                    : NaN;
              const hasRating = Number.isFinite(ratingNum);
              const distRaw = school.distance;
              const distStr = distRaw !== undefined && distRaw !== null ? String(distRaw) : "";

              return (
                <Box
                  key={idx}
                  className="border-border-card bg-bg-card-subtle flex flex-row items-center justify-between gap-3 rounded-xl border p-3 sm:p-4"
                >
                  <Box className="min-w-0 flex-1">
                    <BodyText as="p" size="sm" className="text-text-primary font-semibold">
                      {String(school.name ?? "")}
                    </BodyText>
                    <BodyText as="p" size="xs" className="text-text-secondary mt-1">
                      {String(school.level ?? "")}
                      {t("property_details.bullet_separator", {
                        defaultValue: " • ",
                      })}
                      {String(school.grades ?? "")}
                    </BodyText>
                  </Box>
                  <Box className="flex shrink-0 flex-col items-end gap-2">
                    {hasRating ? <PropertySectionRatingBadge rating={ratingNum} /> : null}
                    {distStr !== "" ? (
                      <Box className="border-border rounded-full border px-2.5 py-0.5">
                        <BodyText as="span" size="xs" className="text-text-secondary font-medium">
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
      </Card>
    </Box>
  );
};
