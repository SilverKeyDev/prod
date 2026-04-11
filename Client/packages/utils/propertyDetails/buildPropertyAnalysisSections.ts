/**
 * Shared pure logic for building ordered property analysis sections.
 * Accepts section config and getIconName so it has no feature imports;
 * callers (propertyDetails) pass DEFAULT_REPORT_SECTIONS and getSectionIconName.
 */

export type PropertyAnalysisSection = {
  key: string;
  label: string;
  data: unknown;
  iconName: string;
  priority: number;
};

export type BuildPropertyAnalysisSectionsOptions = {
  sectionLabels: Record<string, string>;
  defaultPriorityMap: Map<string, number>;
  getIconName: (key: string) => string;
};

export function buildPropertyAnalysisSections(
  propertyAnalysis: Record<string, unknown>,
  excludeSections: string[],
  userPriorities: string[],
  options: BuildPropertyAnalysisSectionsOptions,
): PropertyAnalysisSection[] {
  const { sectionLabels, defaultPriorityMap, getIconName } = options;
  const coreSectionKeys = new Set(["neighborhood_overview", "neighborhood"]);
  const excludedSectionKeys = new Set([
    "pros",
    "cons",
    "highlights_context",
    ...excludeSections,
  ]);

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
        iconName: getIconName(key) ?? "check-circle",
        priority,
      };
    })
    .sort((a, b) => a.priority - b.priority);
}
