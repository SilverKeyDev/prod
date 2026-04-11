export type CommuteTravelTimeRow = {
  location_name?: string;
  name?: string;
  location_address?: string;
  address?: string;
};

export type CommuteMapDestination = {
  address: string;
  label: string;
};

/** Rows from commute_data.travel_times with valid addresses for map markers / directions. */
export function commuteDestinationsForMap(
  travelTimes: CommuteTravelTimeRow[],
): CommuteMapDestination[] {
  return travelTimes
    .map((tt) => {
      const address = String(tt.location_address ?? tt.address ?? "").trim();
      if (!address) return null;
      const label = String(
        tt.location_name ??
          tt.name ??
          tt.location_address ??
          tt.address ??
          "Destination",
      );
      return { address, label };
    })
    .filter((x): x is CommuteMapDestination => x != null);
}
