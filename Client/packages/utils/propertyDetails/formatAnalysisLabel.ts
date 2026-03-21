/**
 * Turns snake_case analysis keys into Title Case labels for display.
 */
export function formatAnalysisLabel(key: string): string {
  return key.replace(/_/g, " ").replace(/\b\w/g, (l) => l.toUpperCase());
}
