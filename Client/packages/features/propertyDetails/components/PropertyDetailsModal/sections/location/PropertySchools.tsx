import React from "react";

import { GraduationCap } from "lucide-react";

import { SectionTintWrapper } from "packages/features/propertyDetails/components/PropertyDetailsModal/sections/layout/SectionTintWrapper";
import { BodyText, Title } from "packages/ui/components/index.web";

import Card from "@/components/layout/Card.web";
import type { PropertyComponentProps } from "@/components/modals/PropertyDetailsModal/types";
import { DEFAULT_REPORT_SECTIONS } from "@/features/profile/utils";

type PropertySchoolsProps = PropertyComponentProps & {
  analysisContent?: unknown;
};

export const PropertySchools: React.FC<PropertySchoolsProps> = ({ property, analysisContent }) => {
  const { schools } = property as unknown as { schools: unknown };

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
      <div className="mt-4 space-y-4">
        {entries.map(([key, value]) => {
          const displayKey = key.replace(/_/g, " ").replace(/\b\w/g, (l) => l.toUpperCase());

          if (Array.isArray(value)) {
            return (
              <div key={key}>
                <Title as="h4" size="sm" className="text-brown mb-2 font-medium">
                  {displayKey}
                </Title>
                <ul className="text-brown/80 ml-4 space-y-1 text-sm">
                  {value.map((item, i) => (
                    <li key={i} className="list-disc">
                      {String(item)}
                    </li>
                  ))}
                </ul>
              </div>
            );
          }

          return (
            <div key={key} className="flex flex-col space-y-1">
              <BodyText as="span" className="text-brown text-sm font-medium">
                {displayKey}
              </BodyText>
              <BodyText as="span" className="text-brown/80 text-sm">
                {String(value)}
              </BodyText>
            </div>
          );
        })}
      </div>
    );
  };

  return (
    <div className="p-6">
      <div className="mb-4 flex items-center gap-2">
        <GraduationCap className="text-brown h-5 w-5" />
        <Title as="h3" size="lg" className="text-brown font-semibold">
          {sectionLabel}
        </Title>
      </div>

      <Card className="mt-2 p-4">
        {hasSchools ? (
          <div className="space-y-3">
            {schoolList.slice(0, 6).map((school, idx) => (
              <div key={idx} className="flex items-center justify-between">
                <div className="flex-1">
                  <div className="text-brown font-medium">{String(school.name ?? "")}</div>
                  <div className="text-sm text-gray-600">
                    {String(school.level ?? "")} • {String(school.grades ?? "")}
                  </div>
                </div>
                <div className="text-right">
                  <div className="text-brown text-sm font-medium">
                    {String(school.rating ?? 0)}/10
                  </div>
                  <div className="text-xs text-gray-500">{String(school.distance ?? 0)} mi</div>
                </div>
              </div>
            ))}
          </div>
        ) : null}
        {analysisContent !== undefined && analysisContent !== null && (
          <SectionTintWrapper className="mt-4">
            {renderAnalysisContent(analysisContent)}
          </SectionTintWrapper>
        )}
      </Card>
    </div>
  );
};
