import type { OnboardingData } from "./types";

export type ImportantLocation = NonNullable<
  OnboardingData["important_locations"]
>[number];

export function getPreservedImportantLocations(
  previous: ImportantLocation[] | undefined | null,
  next: ImportantLocation[] | undefined | null,
): ImportantLocation[] | undefined {
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
