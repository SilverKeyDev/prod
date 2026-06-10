import {
  getClimateEnvironmentalSection,
  hasEnvironmentalFactorsContent,
} from "packages/utils/transaction/propertyDetails/analysis/environmentalFactors";
import { getNeighborhoodAnalysisPayload } from "packages/utils/transaction/propertyDetails/analysis/neighborhoodAnalysisPayload";

export type PropertyDetailsLayoutInput = {
  property: unknown;
  propertyAnalysis?: Record<string, unknown> | null;
  hasCommute?: boolean;
  commuteAnalysis?: unknown;
  familyFriendlyAnalysis?: unknown;
};

export type ListingAgentDisplay = {
  hasAgent: boolean;
};

/**
 * When commute has travel times, the commute section renders the map — hide standalone location map.
 */
export function shouldHideStandaloneLocationMap(property: unknown): boolean {
  const cd = (property as { commute_data?: { travel_times?: unknown[] } }).commute_data;
  return Array.isArray(cd?.travel_times) && cd.travel_times.length > 0;
}

/** Sections already rendered in Location/Match tabs — exclude from PropertyAnalysis to avoid duplication. */
export function getPropertyDetailsExcludeSections(input: PropertyDetailsLayoutInput): string[] {
  const { propertyAnalysis, hasCommute = false, commuteAnalysis, familyFriendlyAnalysis } = input;

  const neighborhoodAnalysis = getNeighborhoodAnalysisPayload(propertyAnalysis ?? undefined);
  const hasNeighborhood = neighborhoodAnalysis != null;
  const climateEnvironmentalRaw = getClimateEnvironmentalSection(propertyAnalysis ?? undefined);
  const hasEnvironmentalSection = hasEnvironmentalFactorsContent(climateEnvironmentalRaw);

  const out: string[] = [];
  if (hasCommute || commuteAnalysis) out.push("commute");
  if (familyFriendlyAnalysis) out.push("family_friendly");
  if (hasNeighborhood || neighborhoodAnalysis) {
    out.push("neighborhood_overview");
    out.push("neighborhood");
    out.push("age_distribution");
    out.push("race_distribution");
    out.push("income_distribution");
    out.push("education_distribution");
    out.push("demographics");
  }
  if (hasEnvironmentalSection) out.push("climate_environmental_safety");
  return out;
}

/** Stream stays loading until `complete`, but agent arrives on `basic`. */
export function shouldShowListingAgentSkeleton(
  isLoading: boolean,
  agent: ListingAgentDisplay
): boolean {
  return isLoading && !agent.hasAgent;
}
