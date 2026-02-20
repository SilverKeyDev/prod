import type {
  CompareHomesComparisonField,
  CompareHomesPropertyDetails,
} from "packages/utils/domain/compareHomes/types";

export function addFeatureFields(
  fields: CompareHomesComparisonField[],
  comparisonData: CompareHomesPropertyDetails[],
): void {
  const hasCombinedFeatures = comparisonData.some((h) => {
    if (h.combinedFeatures && typeof h.combinedFeatures === "object")
      return true;
    if (h.features && typeof h.features === "object") {
      const features = h.features as Record<string, unknown>;
      return (
        features._combined_features &&
        typeof features._combined_features === "object"
      );
    }
    return false;
  });

  if (hasCombinedFeatures) {
    fields.push({
      key: "combinedFeatures",
      label: "Features",
      getValue: (h) => {
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

        const displayParts: string[] = [];

        if (preferred.length > 0) {
          displayParts.push(
            `✓ ${preferred.slice(0, 3).join(", ")}${preferred.length > 3 ? "..." : ""}`,
          );
        }

        if (dealbreakers.length > 0) {
          displayParts.push(
            `⚠ ${dealbreakers.slice(0, 2).join(", ")}${dealbreakers.length > 2 ? "..." : ""}`,
          );
        }

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
    return;
  }

  const hasFeatures = comparisonData.some(
    (h) => h.features && typeof h.features === "object",
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
          ? featureList.slice(0, 5).join("; ") +
              (featureList.length > 5 ? "..." : "")
          : "—";
      },
    });
  }

  const hasImageFeatures = comparisonData.some(
    (h) => h.imageFeatures && typeof h.imageFeatures === "object",
  );
  if (hasImageFeatures) {
    fields.push({
      key: "imageFeatures",
      label: "Image Features",
      getValue: (h) => {
        if (!h.imageFeatures || typeof h.imageFeatures !== "object") return "—";
        const imgFeatures = h.imageFeatures as {
          clean?: string[];
          error?: string;
        };
        if (imgFeatures.error) return "—";
        if (Array.isArray(imgFeatures.clean) && imgFeatures.clean.length > 0) {
          return (
            imgFeatures.clean.slice(0, 5).join("; ") +
            (imgFeatures.clean.length > 5 ? "..." : "")
          );
        }
        return "—";
      },
    });
  }
}
