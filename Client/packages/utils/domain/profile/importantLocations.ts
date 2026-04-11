/** Shape needed for merge/preserve logic (matches prefs important_locations items). */
export type PreservableImportantLocation = {
  address: string;
  commute_tolerance?: number;
};

/**
 * When the user clears all important locations, keep the last removed entry so
 * isochrone/search never persist an empty list unintentionally (same as Settings).
 */
export function getPreservedImportantLocations(
  previous: PreservableImportantLocation[] | undefined | null,
  next: PreservableImportantLocation[] | undefined | null,
): PreservableImportantLocation[] | undefined {
  const prevLocations = Array.isArray(previous) ? previous : [];
  const nextLocations = Array.isArray(next) ? next : [];

  if (prevLocations.length === 0) {
    return nextLocations;
  }

  if (nextLocations.length === 0) {
    const removedLocation =
      [...prevLocations]
        .reverse()
        .find(
          (prevLocation) =>
            !nextLocations.some(
              (nextLocation) =>
                nextLocation &&
                prevLocation &&
                nextLocation.address === prevLocation.address &&
                nextLocation.commute_tolerance ===
                  prevLocation.commute_tolerance,
            ),
        ) ?? prevLocations[prevLocations.length - 1];

    return removedLocation ? [removedLocation] : nextLocations;
  }

  return nextLocations;
}
