/**
 * Helpers for PropertyAnalysis; extracted to satisfy max-lines-per-function.
 */
import React from "react";

import { DEFAULT_REPORT_SECTIONS } from "packages/utils/domain/profile";

import { renderSectionIcon } from "@/components/modals/CompareHomesModal/sectionIcons";
import { BodyText, Title } from "@/components/ui/index.web";

export function renderPropertyAnalysisSectionContent(
  _sectionKey: string,
  sectionData: unknown,
  noDataLabel: string,
): React.ReactNode {
  if (!sectionData || typeof sectionData !== "object") return null;
  const data = sectionData as Record<string, unknown>;

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

  const entries = Object.entries(data).filter(
    ([_, value]) => value !== null && value !== undefined && value !== "",
  );
  if (entries.length === 0) {
    return (
      <BodyText as="p" size="sm" className="text-brown/60">
        {noDataLabel}
      </BodyText>
    );
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
              <Title as="h4" size="sm" className="mb-2 font-medium text-brown">
                {displayKey}
              </Title>
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
              <Title as="h4" size="sm" className="mb-2 font-medium text-brown">
                {displayKey}
              </Title>
              <div className="space-y-2 text-sm text-brown/70">
                {Object.entries(value as Record<string, unknown>).map(
                  ([subKey, subValue]) => (
                    <div key={subKey} className="flex flex-col">
                      <BodyText as="span" className="font-medium text-brown">
                        {subKey
                          .replace(/_/g, " ")
                          .replace(/\b\w/g, (l) => l.toUpperCase())}
                      </BodyText>
                      <BodyText as="span" className="text-brown/80">
                        {String(subValue)}
                      </BodyText>
                    </div>
                  ),
                )}
              </div>
            </div>
          );
        }
        return (
          <div key={key} className="flex flex-col space-y-1">
            <BodyText as="span" className="text-sm font-medium text-brown">
              {displayKey}
            </BodyText>
            <BodyText as="span" className="text-sm text-brown/80">
              {String(value)}
            </BodyText>
          </div>
        );
      })}
    </div>
  );
}

export type DynamicSectionItem = {
  key: string;
  label: string;
  data: unknown;
  icon: React.ReactNode;
  priority: number;
};

export function buildPropertyAnalysisDynamicSections(
  propertyAnalysis: Record<string, unknown>,
  excludeSections: string[],
  userPriorities: string[],
): DynamicSectionItem[] {
  const coreSectionKeys = new Set(["neighborhood_overview"]);
  const excludedSectionKeys = new Set(["pros", "cons", ...excludeSections]);
  const sectionLabels: Record<string, string> = {};
  DEFAULT_REPORT_SECTIONS.forEach((section: { key: string; label: string }) => {
    sectionLabels[section.key] = section.label;
  });
  const defaultPriorityMap = new Map<string, number>();
  DEFAULT_REPORT_SECTIONS.forEach((section, index) => {
    defaultPriorityMap.set(section.key, index);
  });

  const allSectionKeys = Object.keys(propertyAnalysis).filter(
    (key) =>
      propertyAnalysis[key] !== null && propertyAnalysis[key] !== undefined,
  );

  return allSectionKeys
    .filter((key) => !coreSectionKeys.has(key) && !excludedSectionKeys.has(key))
    .map((key) => {
      const userPriorityIndex = userPriorities.indexOf(key);
      const priority =
        userPriorityIndex >= 0
          ? userPriorityIndex
          : 1000 + (defaultPriorityMap.get(key) ?? 9999);
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
}
