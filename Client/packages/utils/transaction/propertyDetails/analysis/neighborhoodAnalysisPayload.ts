/**
 * Server may emit `neighborhood_overview` (normalized) or legacy `neighborhood` (Perplexity section key).
 */
export function getNeighborhoodAnalysisPayload(
  propertyAnalysis: Record<string, unknown> | undefined | null
): unknown {
  if (!propertyAnalysis) return undefined;
  return propertyAnalysis.neighborhood_overview ?? propertyAnalysis.neighborhood;
}
