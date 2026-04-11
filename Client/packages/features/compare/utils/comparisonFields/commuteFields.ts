import type {
  CompareHomesComparisonField,
  CompareHomesPropertyDetails,
} from "packages/features/compare/types/compareHomes";

export function addCommuteFields(
  fields: CompareHomesComparisonField[],
  comparisonData: CompareHomesPropertyDetails[],
): void {
  const hasCommuteData = comparisonData.some(
    (h) => h.commuteData && typeof h.commuteData === "object",
  );
  if (!hasCommuteData) return;

  const locationNames = new Set<string>();
  comparisonData.forEach((h) => {
    if (h.commuteData && typeof h.commuteData === "object") {
      const commute = h.commuteData as Record<string, unknown>;
      if (
        !commute.error &&
        commute.travel_times &&
        Array.isArray(commute.travel_times)
      ) {
        (commute.travel_times as Array<{ name?: string }>).forEach((tt) => {
          if (tt.name) {
            locationNames.add(tt.name);
          }
        });
      }
    }
  });

  locationNames.forEach((locationName) => {
    fields.push({
      key: `commute_${locationName}`,
      label: `Commute to '${locationName}'`,
      getValue: (h) => {
        if (!h.commuteData || typeof h.commuteData !== "object") return "-";
        const commute = h.commuteData as Record<string, unknown>;
        if (commute.error) return "-";
        if (commute.travel_times && Array.isArray(commute.travel_times)) {
          const travelTime = (
            commute.travel_times as Array<{
              name?: string;
              travel_time?: string | null;
            }>
          ).find((tt) => tt.name === locationName);
          if (travelTime && travelTime.travel_time) {
            return String(travelTime.travel_time);
          }
        }
        return "-";
      },
    });
  });
}
