import { GraduationCap } from "lucide-react";
import React from "react";

import Card from "../../../layout/Card";
import { DEFAULT_REPORT_SECTIONS } from "../../../../features/onboardpersonalize/lib/constants";

import type { PropertyComponentProps } from "../types";
import { SectionTintWrapper } from "./SectionTintWrapper";

type PropertySchoolsProps = PropertyComponentProps & {
  analysisContent?: unknown;
};

export const PropertySchools: React.FC<PropertySchoolsProps> = ({
  property,
  analysisContent,
}) => {
  const { schools } = property as unknown as { schools: unknown };

  const hasSchools = schools && Array.isArray(schools) && schools.length > 0;
  if (!hasSchools && !analysisContent) {
    return null;
  }

  const schoolList = hasSchools
    ? (schools as Array<Record<string, unknown>>)
    : [];

  // Get section label
  const sectionLabel =
    DEFAULT_REPORT_SECTIONS.find(
      (s: { key: string; label: string }) => s.key === "family_friendly",
    )?.label || "Nearby Schools";

  // Helper to render analysis content
  const renderAnalysisContent = (data: unknown): React.ReactNode | null => {
    if (!data || typeof data !== "object") return null;

    const dataObj = data as Record<string, unknown>;
    const entries = Object.entries(dataObj).filter(
      ([_, value]) => value !== null && value !== undefined && value !== "",
    );

    if (entries.length === 0) {
      return null;
    }

    return (
      <div className="mt-4 space-y-4">
        {entries.map(([key, value]) => {
          const displayKey = key
            .replace(/_/g, " ")
            .replace(/\b\w/g, (l) => l.toUpperCase());

          if (Array.isArray(value)) {
            return (
              <div key={key}>
                <h4 className="mb-2 text-sm font-medium text-brown">
                  {displayKey}
                </h4>
                <ul className="space-y-1 ml-4 text-sm text-brown/80">
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
              <span className="text-sm font-medium text-brown">
                {displayKey}
              </span>
              <span className="text-sm text-brown/80">{String(value)}</span>
            </div>
          );
        })}
      </div>
    );
  };

  return (
    <div className="p-6">
      <div className="mb-4 flex items-center gap-2">
        <GraduationCap className="h-5 w-5 text-brown" />
        <h3 className="text-lg font-semibold text-brown">{sectionLabel}</h3>
      </div>

      <Card className="p-4 mt-2">
        {hasSchools ? (
          <div className="space-y-3">
            {schoolList.slice(0, 6).map((school, idx) => (
              <div key={idx} className="flex items-center justify-between">
                <div className="flex-1">
                  <div className="font-medium text-brown">
                    {String(school.name ?? "")}
                  </div>
                  <div className="text-sm text-gray-600">
                    {String(school.level ?? "")} • {String(school.grades ?? "")}
                  </div>
                </div>
                <div className="text-right">
                  <div className="text-sm font-medium text-brown">
                    {String(school.rating ?? 0)}/10
                  </div>
                  <div className="text-xs text-gray-500">
                    {String(school.distance ?? 0)} mi
                  </div>
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
