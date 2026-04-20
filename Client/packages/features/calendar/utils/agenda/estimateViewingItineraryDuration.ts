/** Default on-site time per property when agent does not override (industry-typical showing block). */
export const DEFAULT_VIEWING_MINUTES_PER_PROPERTY = 30;

export type ViewingLegLike = {
  duration_seconds?: number | null;
};

export type ViewingStopLike = {
  address?: string | null;
};

function countAddressedStops(stops: ViewingStopLike[]): number {
  return stops.filter((s) => (s.address ?? "").trim().length > 0).length;
}

/**
 * Sums driving time from route legs. `complete` is false if any leg is missing a positive duration.
 */
export function sumLegDriveMinutes(legs: ViewingLegLike[] | null | undefined): {
  minutes: number;
  complete: boolean;
} {
  if (!legs?.length) {
    return { minutes: 0, complete: false };
  }
  let totalSec = 0;
  for (const leg of legs) {
    const sec = leg.duration_seconds;
    if (sec == null || sec <= 0) {
      return { minutes: 0, complete: false };
    }
    totalSec += sec;
  }
  return { minutes: Math.round(totalSec / 60), complete: true };
}

export type ViewingDurationEstimate = {
  stopCount: number;
  minutesPerProperty: number;
  onSiteMinutes: number;
  drivingMinutes: number;
  totalMinutes: number;
  drivingKnown: boolean;
};

/**
 * Rough schedule length: (avg minutes × stops) + driving from Directions legs when the route is built.
 * Returns null when fewer than two addressed stops.
 */
export function estimateViewingItineraryMinutes(input: {
  stops: ViewingStopLike[];
  legs?: ViewingLegLike[] | null;
  minutesPerProperty?: number;
}): ViewingDurationEstimate | null {
  const minutesPerProperty = input.minutesPerProperty ?? DEFAULT_VIEWING_MINUTES_PER_PROPERTY;
  const stopCount = countAddressedStops(input.stops);
  if (stopCount < 2) {
    return null;
  }

  const onSiteMinutes = stopCount * minutesPerProperty;
  const { minutes: drivingMinutes, complete: legsSumOk } = sumLegDriveMinutes(input.legs);
  const expectedLegs = stopCount - 1;
  const legCount = input.legs?.length ?? 0;
  const drivingKnown = legsSumOk && legCount === expectedLegs;

  const totalMinutes = drivingKnown ? onSiteMinutes + drivingMinutes : onSiteMinutes;

  return {
    stopCount,
    minutesPerProperty,
    onSiteMinutes,
    drivingMinutes: drivingKnown ? drivingMinutes : 0,
    totalMinutes,
    drivingKnown,
  };
}

/** e.g. 90 → "1 hr 30 min", 45 → "45 min" */
export function formatMinutesHuman(total: number): string {
  if (total <= 0) {
    return "0 min";
  }
  const h = Math.floor(total / 60);
  const m = total % 60;
  if (h <= 0) {
    return `${m} min`;
  }
  if (m === 0) {
    return h === 1 ? "1 hr" : `${h} hrs`;
  }
  return h === 1 ? `1 hr ${m} min` : `${h} hrs ${m} min`;
}
