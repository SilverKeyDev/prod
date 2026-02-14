import { Shield } from "lucide-react";
import React from "react";

import Card from "../../../layout/Card";
import { DEFAULT_REPORT_SECTIONS } from "../../../../features/onboardpersonalize/lib/constants";

import type { PropertyComponentProps } from "../types";
import { SectionTintWrapper } from "./SectionTintWrapper";

type PropertyNeighborhoodProps = PropertyComponentProps & {
  analysisContent?: unknown;
};

export const PropertyNeighborhood: React.FC<PropertyNeighborhoodProps> = ({
  property,
  analysisContent,
}) => {
  // analysisContent should be the neighborhood_overview data
  const neighborhoodOverview = analysisContent as
    | Record<string, unknown>
    | undefined;

  // Extract age_distribution from neighborhood_overview
  const ageDistribution = neighborhoodOverview?.age_distribution as
    | Record<string, string>
    | undefined;

  // Remove age_distribution from neighborhood_overview for rendering
  const neighborhoodContent = neighborhoodOverview
    ? { ...neighborhoodOverview }
    : undefined;
  if (neighborhoodContent && "age_distribution" in neighborhoodContent) {
    delete neighborhoodContent.age_distribution;
  }

  const hasNeighborhoodContent =
    neighborhoodContent && Object.keys(neighborhoodContent).length > 0;
  const hasAgeDistribution =
    ageDistribution && Object.keys(ageDistribution).length > 0;

  if (!hasNeighborhoodContent && !hasAgeDistribution) {
    return null;
  }

  // Get section label
  const sectionLabel =
    DEFAULT_REPORT_SECTIONS.find(
      (s: { key: string; label: string }) => s.key === "neighborhood",
    )?.label || "Neighborhood Information";

  // Helper to render neighborhood content
  const renderNeighborhoodContent = (
    data: Record<string, unknown>,
  ): React.ReactNode => {
    const entries = Object.entries(data).filter(
      ([_, value]) => value !== null && value !== undefined && value !== "",
    );

    if (entries.length === 0) return null;

    return (
      <div className="space-y-4">
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

          if (typeof value === "object" && value !== null) {
            return (
              <div
                key={key}
                className="rounded-lg border border-beige/40 bg-beige/10 p-3"
              >
                <h4 className="mb-2 font-medium text-brown">{displayKey}</h4>
                <div className="space-y-2 text-sm text-brown/70">
                  {Object.entries(value as Record<string, unknown>).map(
                    ([subKey, subValue]) => (
                      <div key={subKey} className="flex flex-col">
                        <span className="font-medium text-brown">
                          {subKey
                            .replace(/_/g, " ")
                            .replace(/\b\w/g, (l) => l.toUpperCase())}
                        </span>
                        <span className="text-brown/80">
                          {String(subValue)}
                        </span>
                      </div>
                    ),
                  )}
                </div>
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

  // Helper to render age distribution chart
  const renderAgeDistribution = (
    data: Record<string, string>,
  ): React.ReactNode => {
    const entries = Object.entries(data)
      .map(([key, value]) => {
        // Extract numeric value from percentage string
        const numValue = parseFloat(String(value).replace("%", "")) || 0;
        return { key, value, numValue };
      })
      .sort((a, b) => {
        // Sort by age range order
        const order = ["0-19", "20-34", "35-49", "50-64", "65+"];
        return order.indexOf(a.key) - order.indexOf(b.key);
      });

    const maxValue = Math.max(...entries.map((e) => e.numValue), 100);

    return (
      <div className="space-y-3">
        <h4 className="text-sm font-medium text-brown">Age Distribution</h4>
        <div className="space-y-2">
          {entries.map(({ key, value, numValue }) => (
            <div key={key} className="space-y-1">
              <div className="flex justify-between text-sm">
                <span className="text-brown/70">{key} years</span>
                <span className="font-medium text-brown">{value}</span>
              </div>
              <div className="h-2 w-full overflow-hidden rounded-full bg-beige/30">
                <div
                  className="h-full rounded-full bg-olive transition-all"
                  style={{ width: `${(numValue / maxValue) * 100}%` }}
                />
              </div>
            </div>
          ))}
        </div>
      </div>
    );
  };

  return (
    <div className="p-6">
      <div className="mb-4 flex items-center gap-2">
        <Shield className="h-5 w-5 text-brown" />
        <h3 className="text-lg font-semibold text-brown">{sectionLabel}</h3>
      </div>

      <SectionTintWrapper className="mt-2">
        <div className="grid grid-cols-1 gap-6 md:grid-cols-2">
          {/* Neighborhood Content */}
          {hasNeighborhoodContent && (
            <div>
              <Card className="p-4">
                {renderNeighborhoodContent(neighborhoodContent!)}
              </Card>
            </div>
          )}

          {/* Age Distribution */}
          {hasAgeDistribution && (
            <div>
              <Card className="p-4">
                {renderAgeDistribution(ageDistribution!)}
              </Card>
            </div>
          )}
        </div>
      </SectionTintWrapper>
    </div>
  );
};
