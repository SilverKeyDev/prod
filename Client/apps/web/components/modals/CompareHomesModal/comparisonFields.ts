import type { PropertyDetails, ComparisonField } from "./types";
import { formatPropertyType } from "../../../../../packages/utils/property";
import { formatPrice } from "../PropertyDetailsModal/utils";
import { DEFAULT_REPORT_SECTIONS } from "../../../features/onboardpersonalize/lib/constants";

export function getAllComparisonFields(
  comparisonData: PropertyDetails[],
  loadingStates?: Record<string, boolean>
): ComparisonField[] {
  const fields: ComparisonField[] = [
    {
      key: "price",
      label: "Price",
      getValue: (h) => {
        if (!h.price || h.price === "—") return "—";
        return formatPrice(h.price);
      },
    },
    {
      key: "bedrooms",
      label: "Bedrooms",
      getValue: (h) => String(h.bedrooms ?? "—"),
    },
    {
      key: "bathrooms",
      label: "Bathrooms",
      getValue: (h) => String(h.bathrooms ?? "—"),
    },
    {
      key: "sqft",
      label: "Sqft",
      getValue: (h) => {
        if (!h.sqft || h.sqft === "—") return "—";
        const sqftValue =
          typeof h.sqft === "number" ? h.sqft : parseFloat(String(h.sqft));
        if (isNaN(sqftValue)) return String(h.sqft);
        return `${sqftValue.toLocaleString()} ft`;
      },
    },
    {
      key: "lotSize",
      label: "Lot Size",
      getValue: (h) => {
        if (!h.lotSize || h.lotSize === "—") return "—";
        const lotSizeStr = String(h.lotSize).toLowerCase();

        // Check if already in acres
        if (lotSizeStr.includes("acre")) {
          const acreValue = parseFloat(lotSizeStr.replace(/[^\d.]/g, ""));
          if (!isNaN(acreValue)) {
            return `${acreValue.toFixed(2)} acres`;
          }
        }

        // Try to parse as number (assumed to be in square feet)
        const sqftValue = parseFloat(lotSizeStr.replace(/[^\d.]/g, ""));
        if (!isNaN(sqftValue) && sqftValue > 0) {
          // Convert square feet to acres (1 acre = 43,560 sqft)
          const acres = sqftValue / 43560;
          return `${acres.toFixed(2)} acres`;
        }

        // If we can't parse, return as-is
        return String(h.lotSize);
      },
    },
    {
      key: "yearBuilt",
      label: "Year Built",
      getValue: (h) => String(h.yearBuilt ?? "—"),
    },
    {
      key: "propertyType",
      label: "Property Type",
      getValue: (h) => {
        if (!h.propertyType || h.propertyType === "—") return "—";
        return formatPropertyType(h.propertyType);
      },
    },
  ];

  // Add combined features field if any home has combinedFeatures
  // Check both direct combinedFeatures and persisted _combined_features in features JSON
  const hasCombinedFeatures = comparisonData.some((h) => {
    if (h.combinedFeatures && typeof h.combinedFeatures === "object") return true;
    if (h.features && typeof h.features === "object") {
      const features = h.features as Record<string, unknown>;
      return features._combined_features && typeof features._combined_features === "object";
    }
    return false;
  });
  
  if (hasCombinedFeatures) {
    fields.push({
      key: "combinedFeatures",
      label: "Features",
      getValue: (h) => {
        // Check for direct combinedFeatures first
        let combined = h.combinedFeatures;
        if (!combined && h.features && typeof h.features === "object") {
          const features = h.features as Record<string, unknown>;
          combined = features._combined_features as typeof combined;
        }
        
        if (!combined || typeof combined !== "object") return "—";
        
        const combinedData = combined as {
          combined_features?: string[];
          preferred_overlap?: string[];
          dealbreaker_overlap?: string[];
        };
        const allFeatures = combinedData.combined_features || [];
        const preferred = combinedData.preferred_overlap || [];
        const dealbreakers = combinedData.dealbreaker_overlap || [];
        
        // Build display string with overlap indicators
        const displayParts: string[] = [];
        
        // Show preferred overlaps first (with indicator)
        if (preferred.length > 0) {
          displayParts.push(`✓ ${preferred.slice(0, 3).join(", ")}${preferred.length > 3 ? "..." : ""}`);
        }
        
        // Show dealbreaker overlaps (with warning indicator)
        if (dealbreakers.length > 0) {
          displayParts.push(`⚠ ${dealbreakers.slice(0, 2).join(", ")}${dealbreakers.length > 2 ? "..." : ""}`);
        }
        
        // Show other features (up to 5 total)
        const shownFeatures = new Set([...preferred, ...dealbreakers]);
        const otherFeatures = allFeatures.filter((f) => !shownFeatures.has(f));
        if (otherFeatures.length > 0) {
          const remaining = 5 - displayParts.length;
          if (remaining > 0) {
            displayParts.push(otherFeatures.slice(0, remaining).join(", "));
          }
        }
        
        return displayParts.length > 0
          ? displayParts.join(" | ") + (allFeatures.length > 5 ? "..." : "")
          : "—";
      },
    });
  } else {
    // Fallback: Add features field if any home has features (for backward compatibility)
    const hasFeatures = comparisonData.some(
      (h) => h.features && typeof h.features === "object"
    );
    if (hasFeatures) {
      fields.push({
        key: "features",
        label: "Features",
        getValue: (h) => {
          if (!h.features || typeof h.features !== "object") return "—";
          const features = h.features as Record<string, unknown>;
          const featureList: string[] = [];
          Object.values(features).forEach((items) => {
            if (Array.isArray(items)) {
              featureList.push(...items.slice(0, 2).map((f) => String(f)));
            }
          });
          return featureList.length > 0
            ? featureList.slice(0, 5).join("; ") + (featureList.length > 5 ? "..." : "")
            : "—";
        },
      });
    }

    // Fallback: Add image features field if any home has imageFeatures (for backward compatibility)
    const hasImageFeatures = comparisonData.some(
      (h) => h.imageFeatures && typeof h.imageFeatures === "object"
    );
    if (hasImageFeatures) {
      fields.push({
        key: "imageFeatures",
        label: "Image Features",
        getValue: (h) => {
          if (!h.imageFeatures || typeof h.imageFeatures !== "object") return "—";
          const imgFeatures = h.imageFeatures as { clean?: string[]; error?: string };
          if (imgFeatures.error) return "—";
          if (Array.isArray(imgFeatures.clean) && imgFeatures.clean.length > 0) {
            return imgFeatures.clean.slice(0, 5).join("; ") + (imgFeatures.clean.length > 5 ? "..." : "");
          }
          return "—";
        },
      });
    }
  }

  // Add commute data fields - one per location (e.g., "Commute to 'Work'")
  const hasCommuteData = comparisonData.some(
    (h) => h.commuteData && typeof h.commuteData === "object"
  );
  if (hasCommuteData) {
    // Collect all unique location names from all homes
    const locationNames = new Set<string>();
    comparisonData.forEach((h) => {
      if (h.commuteData && typeof h.commuteData === "object") {
        const commute = h.commuteData as Record<string, unknown>;
        if (!commute.error && commute.travel_times && Array.isArray(commute.travel_times)) {
          (commute.travel_times as Array<{ name?: string }>).forEach((tt) => {
            if (tt.name) {
              locationNames.add(tt.name);
            }
          });
        }
      }
    });
    
    // Create a field for each location
    locationNames.forEach((locationName) => {
      fields.push({
        key: `commute_${locationName}`,
        label: `Commute to '${locationName}'`,
        getValue: (h) => {
          if (!h.commuteData || typeof h.commuteData !== "object") return "—";
          const commute = h.commuteData as Record<string, unknown>;
          if (commute.error) return "—";
          if (commute.travel_times && Array.isArray(commute.travel_times)) {
            const travelTime = (commute.travel_times as Array<{ name?: string; travel_time?: string | null }>).find(
              (tt) => tt.name === locationName
            );
            if (travelTime && travelTime.travel_time) {
              return String(travelTime.travel_time);
            }
          }
          return "—";
        },
      });
    });
  }

  // Helper function to extract individual fields from a section object
  const extractSectionFields = (
    sectionData: unknown,
    sectionKey: string
  ): Array<{ fieldKey: string; label: string; getValue: (h: PropertyDetails) => string }> => {
    if (!sectionData || typeof sectionData !== "object") {
      return [];
    }

    const data = sectionData as Record<string, unknown>;
    const sectionFields: Array<{
      fieldKey: string;
      label: string;
      getValue: (h: PropertyDetails) => string;
    }> = [];

    // Extract all meaningful fields from the section
    Object.entries(data).forEach(([key, value]) => {
      // Skip null, undefined, empty strings, and complex nested objects
      if (
        value === null ||
        value === undefined ||
        value === "" ||
        (typeof value === "object" && value !== null && !Array.isArray(value))
      ) {
        return;
      }

      // Handle arrays (like lists of items)
      if (Array.isArray(value) && value.length > 0) {
        const displayKey = key.replace(/_/g, " ").replace(/\b\w/g, (l) => l.toUpperCase());
        sectionFields.push({
          fieldKey: `${sectionKey}_${key}`,
          label: displayKey,
          getValue: (h) => {
            if (!h.propertyAnalysis || typeof h.propertyAnalysis !== "object") {
              return "—";
            }
            const sectionData = (h.propertyAnalysis as Record<string, unknown>)[sectionKey];
            if (!sectionData || typeof sectionData !== "object") {
              return "—";
            }
            const fieldValue = (sectionData as Record<string, unknown>)[key];
            if (Array.isArray(fieldValue) && fieldValue.length > 0) {
              return fieldValue.slice(0, 3).join("; ") + (fieldValue.length > 3 ? "..." : "");
            }
            return "—";
          },
        });
        return;
      }

      // Handle simple values (string, number, boolean)
      if (typeof value === "string" || typeof value === "number" || typeof value === "boolean") {
        const displayKey = key.replace(/_/g, " ").replace(/\b\w/g, (l) => l.toUpperCase());
        sectionFields.push({
          fieldKey: `${sectionKey}_${key}`,
          label: displayKey,
          getValue: (h) => {
            if (!h.propertyAnalysis || typeof h.propertyAnalysis !== "object") {
              return "—";
            }
            const sectionData = (h.propertyAnalysis as Record<string, unknown>)[sectionKey];
            if (!sectionData || typeof sectionData !== "object") {
              return "—";
            }
            const fieldValue = (sectionData as Record<string, unknown>)[key];
            if (fieldValue === null || fieldValue === undefined || fieldValue === "") {
              return "—";
            }
            return String(fieldValue);
          },
        });
      }
    });

    return sectionFields;
  };

  // Add pros and cons fields if they exist
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

  // Add fields for each of the 9 priority sections
  // Create a section header row and individual rows for each field within the section
  DEFAULT_REPORT_SECTIONS.forEach((section) => {
    const sectionKey = section.key;
    
    // Check if any home has this section loaded
    const hasSectionData = comparisonData.some(
      (h) =>
        h.propertyAnalysis &&
        typeof h.propertyAnalysis === "object" &&
        (h.propertyAnalysis as Record<string, unknown>)[sectionKey] !== null &&
        (h.propertyAnalysis as Record<string, unknown>)[sectionKey] !== undefined
    );

    // Check if any home is still loading this section
    // A section is loading if:
    // 1. Any home is explicitly loading, OR
    // 2. Some homes have the section but others don't (partial loading)
    const homesWithSection = comparisonData.filter(
      (h) =>
        h.propertyAnalysis &&
        typeof h.propertyAnalysis === "object" &&
        (h.propertyAnalysis as Record<string, unknown>)[sectionKey] !== null &&
        (h.propertyAnalysis as Record<string, unknown>)[sectionKey] !== undefined
    );

    const homesWithoutSection = comparisonData.filter((h) => {
      const hasSection =
        h.propertyAnalysis &&
        typeof h.propertyAnalysis === "object" &&
        (h.propertyAnalysis as Record<string, unknown>)[sectionKey] !== null &&
        (h.propertyAnalysis as Record<string, unknown>)[sectionKey] !== undefined;
      return !hasSection;
    });

    const hasExplicitLoading = comparisonData.some(
      (h) => loadingStates?.[h.id] || h.isLoading
    );

    // Section is loading if explicitly loading OR if partially loaded (some have it, some don't)
    const isSectionLoading =
      hasExplicitLoading ||
      (homesWithSection.length > 0 && homesWithoutSection.length > 0);

    // Show section if it has data OR if it's loading
    if (hasSectionData || isSectionLoading) {
      // Collect fields from ALL homes that have this section (to handle different structures)
      // Use a Set to track unique field keys
      const allSectionFieldsMap = new Map<string, {
        fieldKey: string;
        label: string;
        getValue: (h: PropertyDetails) => string;
      }>();

      // Extract fields from each home that has this section
      comparisonData.forEach((home) => {
        if (
          home.propertyAnalysis &&
          typeof home.propertyAnalysis === "object" &&
          (home.propertyAnalysis as Record<string, unknown>)[sectionKey] !== null &&
          (home.propertyAnalysis as Record<string, unknown>)[sectionKey] !== undefined
        ) {
          const sectionData = (home.propertyAnalysis as Record<string, unknown>)[sectionKey];
          const fields = extractSectionFields(sectionData, sectionKey);
          
          // Add fields to map (will overwrite duplicates with same fieldKey, keeping latest)
          fields.forEach((field) => {
            allSectionFieldsMap.set(field.fieldKey, field);
          });
        }
      });

      const sectionFields = Array.from(allSectionFieldsMap.values());


      // Add section header row (always show if section exists or is loading)
      if (hasSectionData || isSectionLoading) {
        fields.push({
          key: `section_header_${sectionKey}`,
          label: section.label,
          getValue: () => "", // Empty value for header row
          sectionKey: sectionKey,
          isSectionHeader: true,
          isLoading: isSectionLoading,
        });

        // Add individual field rows if we have section data (even if still loading for some homes)
        // This allows users to see data as it comes in, with loading indicators for missing data
        if (hasSectionData && sectionFields.length > 0) {
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
      }
    }
  });

  return fields;
}

