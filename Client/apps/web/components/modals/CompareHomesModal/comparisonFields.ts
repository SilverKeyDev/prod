import type { PropertyDetails, ComparisonField } from "./types";

export function getAllComparisonFields(
  comparisonData: PropertyDetails[]
): ComparisonField[] {
  const fields: ComparisonField[] = [
    { key: "price", label: "Price", getValue: (h) => String(h.price ?? "—") },
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
    { key: "sqft", label: "Sqft", getValue: (h) => String(h.sqft ?? "—") },
    {
      key: "lotSize",
      label: "Lot Size",
      getValue: (h) => String(h.lotSize ?? "—"),
    },
    {
      key: "yearBuilt",
      label: "Year Built",
      getValue: (h) => String(h.yearBuilt ?? "—"),
    },
    {
      key: "propertyType",
      label: "Property Type",
      getValue: (h) => String(h.propertyType ?? h.homeType ?? "—"),
    },
    {
      key: "listingStatus",
      label: "Listing Status",
      getValue: (h) => String(h.listingStatus ?? "—"),
    },
  ];

  // Add property analysis fields
  comparisonData.forEach((home) => {
    if (home.propertyAnalysis) {
      const analysis = home.propertyAnalysis;
      // Pros
      if (analysis.pros && Array.isArray(analysis.pros)) {
        if (!fields.find((f) => f.key === "pros")) {
          fields.push({
            key: "pros",
            label: "Pros",
            getValue: (h) => {
              const pros = (h.propertyAnalysis?.pros as string[]) || [];
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
              const cons = (h.propertyAnalysis?.cons as string[]) || [];
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
              const overview = h.propertyAnalysis?.neighborhood_overview as
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
              const commute = h.propertyAnalysis?.commute as
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
              const family = h.propertyAnalysis?.family_friendly as
                | Record<string, unknown>
                | undefined;
              return family?.family_rating
                ? String(family.family_rating)
                : "—";
            },
          });
        }
      }
    }
  });

  return fields;
}

