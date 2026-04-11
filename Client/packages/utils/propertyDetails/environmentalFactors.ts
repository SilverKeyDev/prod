import {
  parseSectionRatingValue,
  stripSectionRatingField,
  unwrapPropertyAnalysisSection,
} from "./sectionRating";

export const CLIMATE_ENVIRONMENTAL_KEY =
  "climate_environmental_safety" as const;

export const ENVIRONMENTAL_FACTOR_SCORE_KEYS = [
  "noise_pollution_score",
  "fire_score",
  "wind_score",
  "air_pollution_score",
  "humidity_score",
] as const;

export type EnvironmentalFactorScoreKey =
  (typeof ENVIRONMENTAL_FACTOR_SCORE_KEYS)[number];

export function getClimateEnvironmentalSection(
  propertyAnalysis: Record<string, unknown> | null | undefined,
): unknown {
  if (!propertyAnalysis) return undefined;
  return propertyAnalysis[CLIMATE_ENVIRONMENTAL_KEY];
}

export function hasEnvironmentalFactorsContent(raw: unknown): boolean {
  const unwrapped = unwrapPropertyAnalysisSection(
    CLIMATE_ENVIRONMENTAL_KEY,
    raw,
  );
  if (
    unwrapped == null ||
    typeof unwrapped !== "object" ||
    Array.isArray(unwrapped)
  ) {
    return false;
  }
  const o = unwrapped as Record<string, unknown>;
  for (const v of Object.values(o)) {
    if (v === null || v === undefined || v === "") continue;
    if (typeof v === "string" && v.trim() === "") continue;
    if (
      typeof v === "object" &&
      !Array.isArray(v) &&
      Object.keys(v as Record<string, unknown>).length === 0
    ) {
      continue;
    }
    return true;
  }
  return false;
}

export type ParsedEnvironmentalSection = {
  headerRating: number | null;
  factors: Array<{ key: EnvironmentalFactorScoreKey; rating: number | null }>;
  prose: Array<{ fieldKey: string; text: string }>;
};

const PROSE_SKIP = new Set<string>([...ENVIRONMENTAL_FACTOR_SCORE_KEYS]);

export function parseEnvironmentalSection(
  raw: unknown,
): ParsedEnvironmentalSection | null {
  const unwrapped = unwrapPropertyAnalysisSection(
    CLIMATE_ENVIRONMENTAL_KEY,
    raw,
  );
  if (
    unwrapped == null ||
    typeof unwrapped !== "object" ||
    Array.isArray(unwrapped)
  ) {
    return null;
  }
  const { rest, rating: headerRating } = stripSectionRatingField(unwrapped);
  if (rest == null || typeof rest !== "object" || Array.isArray(rest)) {
    return {
      headerRating,
      factors: ENVIRONMENTAL_FACTOR_SCORE_KEYS.map((key) => ({
        key,
        rating: null,
      })),
      prose: [],
    };
  }
  const obj = rest as Record<string, unknown>;
  const factors = ENVIRONMENTAL_FACTOR_SCORE_KEYS.map((key) => ({
    key,
    rating: parseSectionRatingValue(obj[key]),
  }));
  const prose: Array<{ fieldKey: string; text: string }> = [];
  for (const [fieldKey, value] of Object.entries(obj)) {
    if (PROSE_SKIP.has(fieldKey)) continue;
    if (typeof value !== "string") continue;
    const text = value.trim();
    if (!text) continue;
    prose.push({ fieldKey, text });
  }
  return { headerRating, factors, prose };
}
