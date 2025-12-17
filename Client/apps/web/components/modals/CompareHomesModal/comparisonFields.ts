import type { PropertyDetails, ComparisonField } from "./types";
import { formatPropertyType } from "../../../../../packages/utils/property";
import { formatPrice } from "../PropertyDetailsModal/utils";

export function getAllComparisonFields(
  comparisonData: PropertyDetails[]
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
    {
      key: "listingStatus",
      label: "Listing Status",
      getValue: (h) => {
        if (!h.listingStatus || h.listingStatus === "—") return "—";
        return String(h.listingStatus);
      },
    },
  ];

  // Add features field if any home has features
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

  // Add image features field if any home has imageFeatures
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

  // Add commute data field if any home has commuteData
  const hasCommuteData = comparisonData.some(
    (h) => h.commuteData && typeof h.commuteData === "object"
  );
  if (hasCommuteData) {
    fields.push({
      key: "commuteData",
      label: "Commute Data",
      getValue: (h) => {
        if (!h.commuteData || typeof h.commuteData !== "object") return "—";
        const commute = h.commuteData as Record<string, unknown>;
        if (commute.error) return "—";
        const summary =
          commute.summary ||
          commute.overall_rating ||
          commute.commute_rating ||
          commute.property_address;
        return summary ? String(summary).substring(0, 80) + "..." : "—";
      },
    });
  }

  // Add property analysis fields dynamically
  comparisonData.forEach((home) => {
    if (home.propertyAnalysis && typeof home.propertyAnalysis === "object") {
      const analysis = home.propertyAnalysis as Record<string, unknown>;
      
      // Pros
      if (analysis.pros && Array.isArray(analysis.pros)) {
        if (!fields.find((f) => f.key === "pros")) {
          fields.push({
            key: "pros",
            label: "Pros",
            getValue: (h) => {
              const pros = ((h.propertyAnalysis as Record<string, unknown>)?.pros as string[]) || [];
              return pros.slice(0, 3).join("; ") || "—";
            },
          });
        }
      }
      // Cons
      if (analysis.cons && Array.isArray(analysis.cons)) {
        if (!fields.find((f) => f.key === "cons")) {
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
      // Neighborhood overview
      if (analysis.neighborhood_overview) {
        if (!fields.find((f) => f.key === "neighborhood")) {
          fields.push({
            key: "neighborhood",
            label: "Neighborhood",
            getValue: (h) => {
              const overview = (h.propertyAnalysis as Record<string, unknown>)?.neighborhood_overview as
                | Record<string, unknown>
                | undefined;
              return overview?.description
                ? String(overview.description).substring(0, 100) + "..."
                : "—";
            },
          });
        }
      }
      // Commute
      if (analysis.commute) {
        if (!fields.find((f) => f.key === "commute")) {
          fields.push({
            key: "commute",
            label: "Commute",
            getValue: (h) => {
              const commute = (h.propertyAnalysis as Record<string, unknown>)?.commute as
                | Record<string, unknown>
                | undefined;
              if (commute) {
                const summary =
                  commute.summary ||
                  commute.overall_rating ||
                  commute.commute_rating;
                return summary
                  ? String(summary).substring(0, 80) + "..."
                  : "—";
              }
              return "—";
            },
          });
        }
      }
      // Family friendly
      if (analysis.family_friendly) {
        if (!fields.find((f) => f.key === "familyFriendly")) {
          fields.push({
            key: "familyFriendly",
            label: "Family Friendly",
            getValue: (h) => {
              const family = (h.propertyAnalysis as Record<string, unknown>)?.family_friendly as
                | Record<string, unknown>
                | undefined;
              return family?.family_rating
                ? String(family.family_rating)
                : "—";
            },
          });
        }
      }

      // Dynamically add any other propertyAnalysis sections that aren't already covered
      Object.keys(analysis).forEach((key) => {
        if (
          !["pros", "cons", "neighborhood_overview", "commute", "family_friendly"].includes(key) &&
          !fields.find((f) => f.key === key)
        ) {
          const value = analysis[key];
          if (value && typeof value === "object" && !Array.isArray(value)) {
            // It's an object section, try to extract a summary
            const section = value as Record<string, unknown>;
            const summary =
              section.description ||
              section.summary ||
              section.rating ||
              section.overall_rating;
            if (summary) {
              fields.push({
                key: key,
                label: key.replace(/_/g, " ").replace(/\b\w/g, (l) => l.toUpperCase()),
                getValue: (h) => {
                  const sectionData = (h.propertyAnalysis as Record<string, unknown>)?.[key] as
                    | Record<string, unknown>
                    | undefined;
                  if (sectionData) {
                    const sectionSummary =
                      sectionData.description ||
                      sectionData.summary ||
                      sectionData.rating ||
                      sectionData.overall_rating;
                    return sectionSummary
                      ? String(sectionSummary).substring(0, 80) + "..."
                      : "—";
                  }
                  return "—";
                },
              });
            }
          } else if (typeof value === "string" || typeof value === "number") {
            // It's a simple value
            fields.push({
              key: key,
              label: key.replace(/_/g, " ").replace(/\b\w/g, (l) => l.toUpperCase()),
              getValue: (h) => {
                const sectionValue = (h.propertyAnalysis as Record<string, unknown>)?.[key];
                return sectionValue ? String(sectionValue) : "—";
              },
            });
          }
        }
      });
    }
  });

  return fields;
}

