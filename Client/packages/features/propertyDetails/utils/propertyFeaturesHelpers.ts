type ImageFeatures = {
  clean: string[];
  error?: unknown;
};

type Features = Record<string, string[]>;

export function isImageFeatures(x: unknown): x is ImageFeatures {
  return (
    typeof x === "object" &&
    x !== null &&
    "clean" in x &&
    Array.isArray((x as Record<string, unknown>).clean)
  );
}

export function isFeatures(x: unknown): x is Features {
  if (typeof x !== "object" || x === null) return false;
  return Object.values(x as Record<string, unknown>).every(
    (v) =>
      Array.isArray(v) && (v as unknown[]).every((s) => typeof s === "string"),
  );
}

export const deduplicateFeatures = (features: string[]): string[] => {
  const seen = new Set<string>();
  return features.filter((feature) => {
    const trimmed = feature.trim();
    if (!trimmed) return false;
    const normalizedKey = trimmed.toLowerCase().replace(/\s+/g, " ");
    if (seen.has(normalizedKey)) return false;
    const unneededPatterns = [
      /^none$/i,
      /^n\/a$/i,
      /^na$/i,
      /^unknown$/i,
      /^not available$/i,
      /^not specified$/i,
      /^null$/i,
      /^undefined$/i,
    ];
    if (unneededPatterns.some((pattern) => pattern.test(trimmed))) {
      return false;
    }
    seen.add(normalizedKey);
    return true;
  });
};

export const sanitizeCategoryFeatures = (feats: Features): Features => {
  const result: Features = {};
  Object.entries(feats).forEach(([category, list]) => {
    // Filter out architectural_style category as it's not a useful feature to display
    const normalizedCategory = category.toLowerCase().replace(/[_\s-]/g, "");
    if (normalizedCategory === "architecturalstyle") {
      return;
    }

    const sanitized = deduplicateFeatures(list);
    if (sanitized.length > 0) {
      result[category] = sanitized;
    }
  });
  return result;
};

export const FEATURE_ICONS: Record<string, string> = {
  appliances: "utensils-crossed",
  basement: "building",
  bathrooms: "bath",
  bedroom: "bed",
  bedrooms: "bed",
  cooling: "snowflake",
  dining: "utensils",
  exterior: "building-2",
  features: "sparkles",
  flooring: "grid-3x3",
  garage: "car",
  heating: "flame",
  interior: "home",
  kitchen: "home",
  laundry: "home",
  listing: "file-text",
  lot: "map-pin",
  parking: "car",
  school: "graduation-cap",
  schools: "graduation-cap",
  utilities: "settings-2",
};

export const formatCategoryTitle = (rawCategory: string): string => {
  const normalized = rawCategory
    .replace(/_/g, " ")
    .replace(/([a-z])([A-Z])/g, "$1 $2")
    .trim();
  return normalized
    .split(/\s+/)
    .filter(Boolean)
    .map((word) => word[0]?.toUpperCase() + word.slice(1).toLowerCase())
    .join(" ");
};

export const getCategoryIconName = (rawCategory: string): string => {
  const normalized = rawCategory.toLowerCase().replace(/_/g, " ");
  const exact = FEATURE_ICONS[normalized];
  if (exact) return exact;
  const partial = Object.entries(FEATURE_ICONS).find(([key]) =>
    normalized.includes(key),
  )?.[1];
  return partial ?? "square";
};

export type CategoryBlock = {
  key: string;
  title: string;
  lines: string[];
  icon: string;
};

export const buildCategoryBlocks = (
  imageFeatures: unknown,
  features: unknown,
  aiDetectedFeaturesTitle: string,
): CategoryBlock[] | null => {
  const img =
    isImageFeatures(imageFeatures) && !imageFeatures.error
      ? { ...imageFeatures, clean: deduplicateFeatures(imageFeatures.clean) }
      : null;
  const feats = isFeatures(features)
    ? sanitizeCategoryFeatures(features)
    : null;

  if (!img && !feats) return null;

  return [
    ...(img && img.clean.length > 0
      ? [
          {
            key: "ai-detected-features",
            title: aiDetectedFeaturesTitle,
            lines: img.clean.map((feature) => feature.trim()),
            icon: "sparkles",
          },
        ]
      : []),
    ...(feats
      ? Object.entries(feats).map(([category, list]) => ({
          key: category,
          title: formatCategoryTitle(category),
          lines: list,
          icon: getCategoryIconName(category),
        }))
      : []),
  ];
};
