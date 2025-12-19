import { CheckCircle } from "lucide-react";
import React from "react";

import type { PropertyWithAnalysis } from "../../../../../packages/schemas/property";
import Card from "../../layout/Card";
import { DEFAULT_REPORT_SECTIONS } from "../../../features/onboardpersonalize/lib/constants";
import { renderSectionIcon } from "../CompareHomesModal/sectionIcons";

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
  const propertyWithAnalysis = property as PropertyWithAnalysis;
  const propertyAnalysis = propertyWithAnalysis.property_analysis;

  if (!propertyAnalysis) {
    return null;
  }
  // Get section labels mapping
  const sectionLabels: Record<string, string> = {};
  DEFAULT_REPORT_SECTIONS.forEach((section: { key: string; label: string }) => {
    sectionLabels[section.key] = section.label;
  });

  // Helper function to render dynamic section content
  const renderSectionContent = (
    _sectionKey: string,
    sectionData: unknown
  ): React.ReactNode => {
    if (!sectionData || typeof sectionData !== "object") {
      return null;
    }

    const data = sectionData as Record<string, unknown>;

    // Render based on data structure
    if (Array.isArray(data)) {
      return (
        <ul className="space-y-2">
          {data.map((item, i) => (
            <li key={i} className="text-sm text-brown/80">
              {String(item)}
            </li>
          ))}
        </ul>
      );
    }

    // Render object fields
    const entries = Object.entries(data).filter(
      ([_, value]) => value !== null && value !== undefined && value !== ""
    );

    if (entries.length === 0) {
      return <p className="text-sm text-brown/60">No data available</p>;
    }

    return (
      <div className="space-y-4">
        {entries.map(([key, value]) => {
          const displayKey = key
            .replace(/_/g, " ")
            .replace(/\b\w/g, (l) => l.toUpperCase());

          if (Array.isArray(value)) {
            return (
              <div key={key}>
                <h4 className="mb-2 font-medium text-brown">{displayKey}</h4>
                <ul className="space-y-1 ml-4">
                  {value.map((item, i) => (
                    <li key={i} className="text-sm text-brown/80 list-disc">
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
                    )
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

  // Identify which sections are core (hardcoded) vs dynamic (from report sections)
  const coreSectionKeys = new Set(["neighborhood_overview"]);

  // Sections that are rendered separately and should be excluded from dynamic sections
  // - pros/cons: rendered in ProsAndCons component
  // - commute: rendered in PropertyCommute component (with map) - but can be combined with analysis
  // - family_friendly: rendered in PropertySchools component - but can be combined with analysis
  // - neighborhood_overview: rendered in PropertyNeighborhood component (with age_distribution) - but can be combined with analysis
  // - age_distribution: rendered in PropertyNeighborhood component as part of neighborhood section
  const excludedSectionKeys = new Set(["pros", "cons", ...excludeSections]);

  // Get all section keys from propertyAnalysis
  const allSectionKeys = Object.keys(propertyAnalysis).filter(
    (key) =>
      propertyAnalysis[key] !== null && propertyAnalysis[key] !== undefined
  );

  // Create a priority map for fallback ordering using DEFAULT_REPORT_SECTIONS
  const defaultPriorityMap = new Map<string, number>();
  DEFAULT_REPORT_SECTIONS.forEach((section, index) => {
    defaultPriorityMap.set(section.key, index);
  });

  // Separate core and dynamic sections, excluding pros/cons and any sections passed in excludeSections
  // commute and family_friendly are included here but will be combined with dedicated components when both exist
  const dynamicSections = allSectionKeys
    .filter((key) => !coreSectionKeys.has(key) && !excludedSectionKeys.has(key))
    .map((key) => {
      const userPriorityIndex = userPriorities.indexOf(key);
      const priority =
        userPriorityIndex >= 0
          ? userPriorityIndex
          : 1000 + (defaultPriorityMap.get(key) ?? 9999); // Use default order as fallback

      return {
        key,
        label:
          sectionLabels[key] ||
          key.replace(/_/g, " ").replace(/\b\w/g, (l) => l.toUpperCase()),
        data: propertyAnalysis[key],
        icon: renderSectionIcon(key, "h-5 w-5 text-brown"),
        priority,
      };
    })
    .sort((a, b) => a.priority - b.priority);

  return (
    <div className="p-6">
      {/* Dynamic Report Sections */}
      {dynamicSections.length > 0 && (
        <div className="grid grid-cols-1 gap-6">
          {dynamicSections.map((section) => (
            <div key={section.key}>
              <div className="mb-4 flex items-center gap-2">
                {section.icon}
                <h3 className="text-lg font-semibold text-brown">
                  {section.label}
                </h3>
              </div>
              <Card className="p-4 mt-2">
                {renderSectionContent(section.key, section.data)}
              </Card>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};
