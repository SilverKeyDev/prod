import type {
  CompareHomesComparisonField,
  CompareHomesPropertyDetails,
} from "packages/features/compare/types/compareHomes";

import { DEFAULT_REPORT_SECTIONS } from "@/features/profile/utils";

type SectionField = {
  fieldKey: string;
  label: string;
  getValue: (h: CompareHomesPropertyDetails) => string;
};

function makeGetValueForSection(
  sectionKey: string,
  key: string,
  isArray: boolean
): (h: CompareHomesPropertyDetails) => string {
  return (h) => {
    if (!h.propertyAnalysis || typeof h.propertyAnalysis !== "object") {
      return "—";
    }
    const secData = (h.propertyAnalysis as Record<string, unknown>)[sectionKey];
    if (!secData || typeof secData !== "object") {
      return "—";
    }
    const fieldValue = (secData as Record<string, unknown>)[key];
    if (isArray && Array.isArray(fieldValue) && fieldValue.length > 0) {
      return fieldValue.slice(0, 3).join("; ") + (fieldValue.length > 3 ? "..." : "");
    }
    if (fieldValue === null || fieldValue === undefined || fieldValue === "") {
      return "—";
    }
    return String(fieldValue);
  };
}

function extractSectionFields(sectionData: unknown, sectionKey: string): SectionField[] {
  if (!sectionData || typeof sectionData !== "object") {
    return [];
  }

  const data = sectionData as Record<string, unknown>;
  const sectionFields: SectionField[] = [];
  const displayKeyFor = (key: string) =>
    key.replace(/_/g, " ").replace(/\b\w/g, (l) => l.toUpperCase());

  Object.entries(data).forEach(([key, value]) => {
    if (
      value === null ||
      value === undefined ||
      value === "" ||
      (typeof value === "object" && value !== null && !Array.isArray(value))
    ) {
      return;
    }

    const displayKey = displayKeyFor(key);
    if (Array.isArray(value) && value.length > 0) {
      sectionFields.push({
        fieldKey: `${sectionKey}_${key}`,
        label: displayKey,
        getValue: makeGetValueForSection(sectionKey, key, true),
      });
      return;
    }

    if (typeof value === "string" || typeof value === "number" || typeof value === "boolean") {
      sectionFields.push({
        fieldKey: `${sectionKey}_${key}`,
        label: displayKey,
        getValue: makeGetValueForSection(sectionKey, key, false),
      });
    }
  });

  return sectionFields;
}

function pushProsConsFields(
  fields: CompareHomesComparisonField[],
  comparisonData: CompareHomesPropertyDetails[]
): void {
  const hasPros = comparisonData.some(
    (h) =>
      h.propertyAnalysis &&
      typeof h.propertyAnalysis === "object" &&
      Array.isArray((h.propertyAnalysis as Record<string, unknown>).pros)
  );
  if (hasPros) {
    fields.push({
      key: "pros",
      label: "Pros",
      getValue: (h) => {
        const pros = ((h.propertyAnalysis as Record<string, unknown>)?.pros as string[]) || [];
        return pros.slice(0, 3).join("; ") || "—";
      },
    });
  }
  const hasCons = comparisonData.some(
    (h) =>
      h.propertyAnalysis &&
      typeof h.propertyAnalysis === "object" &&
      Array.isArray((h.propertyAnalysis as Record<string, unknown>).cons)
  );
  if (hasCons) {
    fields.push({
      key: "cons",
      label: "Cons",
      getValue: (h) => {
        const cons = ((h.propertyAnalysis as Record<string, unknown>)?.cons as string[]) || [];
        return cons.slice(0, 3).join("; ") || "—";
      },
    });
  }
}

function pushSectionFields(
  fields: CompareHomesComparisonField[],
  comparisonData: CompareHomesPropertyDetails[],
  loadingStates: Record<string, boolean> | undefined,
  sectionsToProcess: Array<{ key: string; label: string }>
): void {
  sectionsToProcess.forEach((section) => {
    const sectionKey = section.key;
    const hasSectionData = comparisonData.some(
      (h) =>
        h.propertyAnalysis &&
        typeof h.propertyAnalysis === "object" &&
        (h.propertyAnalysis as Record<string, unknown>)[sectionKey] != null
    );
    const homesWithSection = comparisonData.filter(
      (h) =>
        h.propertyAnalysis &&
        typeof h.propertyAnalysis === "object" &&
        (h.propertyAnalysis as Record<string, unknown>)[sectionKey] != null
    );
    const homesWithoutSection = comparisonData.filter(
      (h) =>
        !h.propertyAnalysis ||
        typeof h.propertyAnalysis !== "object" ||
        (h.propertyAnalysis as Record<string, unknown>)[sectionKey] == null
    );
    const hasExplicitLoading = comparisonData.some((h) => loadingStates?.[h.id] || h.isLoading);
    const isSectionLoading =
      hasExplicitLoading || (homesWithSection.length > 0 && homesWithoutSection.length > 0);

    fields.push({
      key: `section_header_${sectionKey}`,
      label: section.label,
      getValue: () => "",
      sectionKey: sectionKey,
      isSectionHeader: true,
      isLoading: isSectionLoading,
    });

    if (hasSectionData) {
      const allSectionFieldsMap = new Map<string, SectionField>();
      comparisonData.forEach((home) => {
        if (
          home.propertyAnalysis &&
          typeof home.propertyAnalysis === "object" &&
          (home.propertyAnalysis as Record<string, unknown>)[sectionKey] != null
        ) {
          const sectionData = (home.propertyAnalysis as Record<string, unknown>)[sectionKey];
          const extracted = extractSectionFields(sectionData, sectionKey);
          extracted.forEach((field) => {
            allSectionFieldsMap.set(field.fieldKey, field);
          });
        }
      });
      const sectionFields = Array.from(allSectionFieldsMap.values());
      sectionFields.forEach((field) => {
        fields.push({
          key: field.fieldKey,
          label: field.label,
          getValue: field.getValue,
          sectionKey: sectionKey,
          isSectionHeader: false,
          isLoading: false,
        });
      });
    }
  });
}

export function addAnalysisFields(
  fields: CompareHomesComparisonField[],
  comparisonData: CompareHomesPropertyDetails[],
  loadingStates?: Record<string, boolean>,
  orderedSections?: Array<{ key: string; label: string }>
): void {
  pushProsConsFields(fields, comparisonData);
  const sectionsToProcess =
    orderedSections && orderedSections.length > 0 ? orderedSections : DEFAULT_REPORT_SECTIONS;
  pushSectionFields(fields, comparisonData, loadingStates, sectionsToProcess);
}
