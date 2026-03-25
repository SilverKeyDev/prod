/** Infer backend event type from free-text title (optional hint for create/update). */
export function detectEventTypeFromTitle(title: string): string | undefined {
  const lowerTitle = title.toLowerCase();

  if (
    lowerTitle.includes("viewing") ||
    lowerTitle.includes("tour") ||
    lowerTitle.includes("showing")
  ) {
    return "property_viewing";
  }
  if (lowerTitle.includes("inspection")) {
    return "inspection";
  }
  if (lowerTitle.includes("closing") || lowerTitle.includes("close")) {
    return "closing";
  }
  if (lowerTitle.includes("meeting")) {
    return "meeting";
  }
  if (lowerTitle.includes("appointment")) {
    return "appointment";
  }
  if (lowerTitle.includes("open house")) {
    return "open_house";
  }

  return undefined;
}
